import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../middleware/errorHandler.js';
import { TargetType } from '@prisma/client';
import { z } from 'zod';

export const createFavoriteSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  url: z.string().url().optional().nullable(),
  targetType: z.nativeEnum(TargetType).optional().nullable(),
  targetId: z.string().uuid().optional().nullable(),
  position: z.number().int().min(0).default(0),
});

export const updateFavoriteSchema = createFavoriteSchema.partial();
export const reorderFavoritesSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), position: z.number().int().min(0) })),
});

export type CreateFavoriteInput = z.infer<typeof createFavoriteSchema>;
export type UpdateFavoriteInput = z.infer<typeof updateFavoriteSchema>;

class FavoritesService {
  async findAll(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
    });

    // Resolve internal links
    return Promise.all(favorites.map(async (fav) => {
      if (fav.targetType && fav.targetId) {
        const target = await this.resolveTarget(fav.targetType, fav.targetId);
        return { ...fav, resolvedTarget: target };
      }
      return fav;
    }));
  }

  async findById(id: string, userId: string) {
    const favorite = await prisma.favorite.findFirst({ where: { id, userId } });
    if (!favorite) throw new NotFoundError('Favorite', id);
    return favorite;
  }

  async create(userId: string, data: CreateFavoriteInput) {
    // Get max position
    const maxPos = await prisma.favorite.aggregate({
      where: { userId },
      _max: { position: true },
    });

    return prisma.favorite.create({
      data: {
        ...data,
        position: data.position ?? (maxPos._max.position ?? 0) + 1,
        userId,
      },
    });
  }

  async update(id: string, userId: string, data: UpdateFavoriteInput) {
    await this.findById(id, userId);
    return prisma.favorite.update({ where: { id }, data });
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId);
    await prisma.favorite.delete({ where: { id } });
    return { success: true };
  }

  async reorder(_userId: string, items: { id: string; position: number }[]) {
    await prisma.$transaction(
      items.map((item) =>
        prisma.favorite.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );
    return { success: true };
  }

  private async resolveTarget(type: TargetType, id: string) {
    switch (type) {
      case 'SCRIPT':
        return prisma.script.findUnique({ where: { id }, select: { id: true, title: true } });
      case 'NOTE':
        return prisma.note.findUnique({ where: { id }, select: { id: true, title: true } });
      case 'PROCEDURE':
        return prisma.procedure.findUnique({ where: { id }, select: { id: true, title: true } });
      case 'TODO':
        return prisma.todo.findUnique({ where: { id }, select: { id: true, title: true } });
      case 'PROJECT':
        return prisma.project.findUnique({ where: { id }, select: { id: true, name: true } });
      case 'REGISTRY':
        return prisma.registryEntry.findUnique({ where: { id }, select: { id: true, name: true } });
      case 'ZABBIX':
        return prisma.zabbixItem.findUnique({ where: { id }, select: { id: true, name: true } });
      case 'RSS_FEED':
        return prisma.rssFeed.findUnique({ where: { id }, select: { id: true, title: true } });
      default:
        return null;
    }
  }
}

export const favoritesService = new FavoritesService();
