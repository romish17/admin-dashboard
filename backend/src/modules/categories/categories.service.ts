import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../middleware/errorHandler.js';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  icon: z.string().max(50).optional(),
  section: z.enum(['SCRIPTS', 'REGISTRIES', 'ZABBIX', 'NOTES', 'PROCEDURES', 'TODOS', 'RSS']).optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class CategoriesService {
  async findAll(userId: string, section?: string) {
    const where: Record<string, unknown> = { userId };

    // If section is specified, include categories for that section AND global categories (null section)
    if (section) {
      where.OR = [
        { section: section },
        { section: null },
      ];
    }

    const categories = await prisma.category.findMany({
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
            rssFeeds: true,
          },
        },
      },
    });

    return categories.map((cat) => ({
      ...cat,
      totalItems: Object.values(cat._count).reduce((a: number, b: number) => a + b, 0),
    }));
  }

  async findById(id: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });
    if (!category) throw new NotFoundError('Category', id);
    return category;
  }

  async create(userId: string, data: CreateCategoryInput) {
    const slug = slugify(data.name);
    const section = data.section || null;

    // Check for duplicate slug within same section
    const existing = await prisma.category.findFirst({
      where: { userId, slug, section },
    });
    if (existing) {
      throw new ConflictError('A category with this name already exists in this section');
    }

    return prisma.category.create({
      data: { ...data, slug, section, userId },
    });
  }

  async update(id: string, userId: string, data: UpdateCategoryInput) {
    const current = await this.findById(id, userId);

    const updateData: Record<string, unknown> = { ...data };
    const section = data.section !== undefined ? data.section : current.section;

    if (data.name || data.section !== undefined) {
      const slug = data.name ? slugify(data.name) : current.slug;
      if (data.name) {
        updateData.slug = slug;
      }

      // Check for duplicate slug within same section (excluding current)
      const existing = await prisma.category.findFirst({
        where: { userId, slug, section, NOT: { id } },
      });
      if (existing) {
        throw new ConflictError('A category with this name already exists in this section');
      }
    }

    return prisma.category.update({ where: { id }, data: updateData });
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId);
    await prisma.category.delete({ where: { id } });
    return { success: true };
  }
}

export const categoriesService = new CategoriesService();
