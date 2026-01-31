import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../middleware/errorHandler.js';
import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1).max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
  section: z.enum(['SCRIPTS', 'REGISTRIES', 'ZABBIX', 'NOTES', 'PROCEDURES', 'TODOS', 'RSS']).optional().nullable(),
});

export const updateTagSchema = createTagSchema.partial();

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class TagsService {
  async findAll(userId: string, section?: string) {
    const where: Record<string, unknown> = { userId };

    // If section is specified, include tags for that section AND global tags (null section)
    if (section) {
      where.OR = [
        { section: section },
        { section: null },
      ];
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            scripts: true,
            registryEntries: true,
            zabbixItems: true,
            notes: true,
            procedures: true,
            todos: true,
          },
        },
      },
    });

    return tags.map((tag) => ({
      ...tag,
      usageCount: Object.values(tag._count).reduce((a: number, b: number) => a + b, 0),
    }));
  }

  async findById(id: string, userId: string) {
    const tag = await prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) throw new NotFoundError('Tag', id);
    return tag;
  }

  async create(userId: string, data: CreateTagInput) {
    const slug = slugify(data.name);
    const section = data.section || null;

    const existing = await prisma.tag.findFirst({ where: { userId, slug, section } });
    if (existing) {
      throw new ConflictError('A tag with this name already exists in this section');
    }

    return prisma.tag.create({ data: { ...data, slug, section, userId } });
  }

  async update(id: string, userId: string, data: UpdateTagInput) {
    const current = await this.findById(id, userId);

    const updateData: Record<string, unknown> = { ...data };
    const section = data.section !== undefined ? data.section : current.section;

    if (data.name || data.section !== undefined) {
      const slug = data.name ? slugify(data.name) : current.slug;
      if (data.name) {
        updateData.slug = slug;
      }

      const existing = await prisma.tag.findFirst({
        where: { userId, slug, section, NOT: { id } },
      });
      if (existing) {
        throw new ConflictError('A tag with this name already exists in this section');
      }
    }

    return prisma.tag.update({ where: { id }, data: updateData });
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId);
    await prisma.tag.delete({ where: { id } });
    return { success: true };
  }

  // Bulk create tags (useful for import)
  async bulkCreate(userId: string, names: string[]) {
    const results = [];
    for (const name of names) {
      const slug = slugify(name);
      const existing = await prisma.tag.findFirst({ where: { userId, slug } });
      if (existing) {
        results.push(existing);
      } else {
        const tag = await prisma.tag.create({ data: { name, slug, userId } });
        results.push(tag);
      }
    }
    return results;
  }
}

export const tagsService = new TagsService();
