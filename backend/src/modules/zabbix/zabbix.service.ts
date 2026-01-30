import { ZabbixType } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../middleware/errorHandler.js';
import { PaginationParams, paginatedResponse, getPrismaSkipTake } from '../../utils/pagination.js';
import { z } from 'zod';

export const createZabbixSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  itemType: z.nativeEnum(ZabbixType).default(ZabbixType.ITEM),
  content: z.record(z.unknown()), // JSON content for flexibility
  version: z.string().max(20).optional(),
  zabbixId: z.string().optional().nullable(),
  isFavorite: z.boolean().default(false),
  categoryId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().default([]),
  linkedNoteIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateZabbixSchema = createZabbixSchema.partial();

export const zabbixQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  itemType: z.nativeEnum(ZabbixType).optional(),
  categoryId: z.string().uuid().optional(),
  isFavorite: z.string().optional().transform((v) => v === 'true'),
});

export type CreateZabbixInput = z.infer<typeof createZabbixSchema>;
export type UpdateZabbixInput = z.infer<typeof updateZabbixSchema>;
export type ZabbixQueryInput = z.infer<typeof zabbixQuerySchema>;

class ZabbixService {
  async findAll(userId: string, query: ZabbixQueryInput, pagination: PaginationParams) {
    const where: Record<string, unknown> = { userId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.itemType) where.itemType = query.itemType;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isFavorite !== undefined) where.isFavorite = query.isFavorite;

    const [items, total] = await Promise.all([
      prisma.zabbixItem.findMany({
        where,
        ...getPrismaSkipTake(pagination),
        orderBy: { [pagination.sortBy || 'updatedAt']: pagination.sortOrder },
        include: {
          category: { select: { id: true, name: true, color: true } },
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
        },
      }),
      prisma.zabbixItem.count({ where }),
    ]);

    return paginatedResponse(
      items.map((i) => ({ ...i, tags: i.tags.map((t) => t.tag) })),
      total,
      pagination
    );
  }

  async findById(id: string, userId: string) {
    const item = await prisma.zabbixItem.findFirst({
      where: { id, userId },
      include: {
        category: true,
        tags: { include: { tag: true } },
        notes: { include: { note: { select: { id: true, title: true } } } },
      },
    });

    if (!item) throw new NotFoundError('Zabbix item', id);

    return {
      ...item,
      tags: item.tags.map((t) => t.tag),
      linkedNotes: item.notes.map((n) => n.note),
    };
  }

  async create(userId: string, data: CreateZabbixInput) {
    const { tagIds, linkedNoteIds, ...itemData } = data;

    const item = await prisma.zabbixItem.create({
      data: {
        ...itemData,
        userId,
        tags: tagIds?.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
        notes: linkedNoteIds?.length ? { create: linkedNoteIds.map((noteId) => ({ noteId })) } : undefined,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    return { ...item, tags: item.tags.map((t) => t.tag) };
  }

  async update(id: string, userId: string, data: UpdateZabbixInput) {
    await this.findById(id, userId);
    const { tagIds, linkedNoteIds, ...itemData } = data;

    const item = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.zabbixItemTag.deleteMany({ where: { zabbixItemId: id } });
        if (tagIds.length > 0) {
          await tx.zabbixItemTag.createMany({
            data: tagIds.map((tagId) => ({ zabbixItemId: id, tagId })),
          });
        }
      }

      if (linkedNoteIds !== undefined) {
        await tx.zabbixNote.deleteMany({ where: { zabbixItemId: id } });
        if (linkedNoteIds.length > 0) {
          await tx.zabbixNote.createMany({
            data: linkedNoteIds.map((noteId) => ({ zabbixItemId: id, noteId })),
          });
        }
      }

      return tx.zabbixItem.update({
        where: { id },
        data: itemData,
        include: { category: true, tags: { include: { tag: true } } },
      });
    });

    return { ...item, tags: item.tags.map((t) => t.tag) };
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId);
    await prisma.zabbixItem.delete({ where: { id } });
    return { success: true };
  }

  async toggleFavorite(id: string, userId: string) {
    const item = await this.findById(id, userId);
    const updated = await prisma.zabbixItem.update({
      where: { id },
      data: { isFavorite: !item.isFavorite },
    });
    return { isFavorite: updated.isFavorite };
  }

  async search(userId: string, query: string, limit = 10) {
    const items = await prisma.zabbixItem.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        itemType: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    });

    return items.map((item) => ({
      id: item.id,
      type: 'zabbix' as const,
      title: item.name,
      description: item.description,
      tags: item.tags.map((t) => t.tag.name),
      categories: item.category ? [item.category.name] : [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }
}

export const zabbixService = new ZabbixService();
