import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../middleware/errorHandler.js';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  icon: z.string().max(50).optional(),
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
  async findAll(userId: string) {
    const categories = await prisma.category.findMany({
      where: { userId },
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
      totalItems: Object.values(cat._count).reduce((a, b) => a + b, 0),
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

    // Check for duplicate slug
    const existing = await prisma.category.findFirst({
      where: { userId, slug },
    });
    if (existing) {
      throw new ConflictError('A category with this name already exists');
    }

    return prisma.category.create({
      data: { ...data, slug, userId },
    });
  }

  async update(id: string, userId: string, data: UpdateCategoryInput) {
    await this.findById(id, userId);

    const updateData: Record<string, unknown> = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name);

      // Check for duplicate slug (excluding current)
      const existing = await prisma.category.findFirst({
        where: { userId, slug: updateData.slug as string, NOT: { id } },
      });
      if (existing) {
        throw new ConflictError('A category with this name already exists');
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
