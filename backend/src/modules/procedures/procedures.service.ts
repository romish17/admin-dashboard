import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../middleware/errorHandler.js';
import { PaginationParams, paginatedResponse, getPrismaSkipTake } from '../../utils/pagination.js';
import { z } from 'zod';

export const createProcedureSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1), // Rich HTML content from WYSIWYG editor
  isPinned: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  categoryId: z.string().uuid().optional().nullable().or(z.literal('')).transform(v => v || null),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateProcedureSchema = createProcedureSchema.partial();

export const procedureQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isFavorite: z.string().optional().transform((v) => v === 'true'),
});

export type CreateProcedureInput = z.infer<typeof createProcedureSchema>;
export type UpdateProcedureInput = z.infer<typeof updateProcedureSchema>;
export type ProcedureQueryInput = z.infer<typeof procedureQuerySchema>;

class ProceduresService {
  async findAll(userId: string, query: ProcedureQueryInput, pagination: PaginationParams) {
    const where: Record<string, unknown> = { userId };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isFavorite !== undefined) where.isFavorite = query.isFavorite;

    const [procedures, total] = await Promise.all([
      prisma.procedure.findMany({
        where,
        ...getPrismaSkipTake(pagination),
        orderBy: [
          { isPinned: 'desc' },
          { [pagination.sortBy || 'updatedAt']: pagination.sortOrder },
        ],
        include: {
          category: { select: { id: true, name: true, color: true } },
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
        },
      }),
      prisma.procedure.count({ where }),
    ]);

    return paginatedResponse(
      procedures.map((p) => ({ ...p, tags: p.tags.map((t) => t.tag) })),
      total,
      pagination
    );
  }

  async findById(id: string, userId: string) {
    const procedure = await prisma.procedure.findFirst({
      where: { id, userId },
      include: {
        category: true,
        tags: { include: { tag: true } },
        linkedScripts: { include: { script: { select: { id: true, title: true } } } },
        linkedRegistries: { include: { registryEntry: { select: { id: true, name: true } } } },
        linkedNotes: { include: { note: { select: { id: true, title: true } } } },
      },
    });

    if (!procedure) throw new NotFoundError('Procedure', id);

    return {
      ...procedure,
      tags: procedure.tags.map((t) => t.tag),
      linkedScripts: procedure.linkedScripts.map((s) => s.script),
      linkedRegistries: procedure.linkedRegistries.map((r) => r.registryEntry),
      linkedNotes: procedure.linkedNotes.map((n) => n.note),
    };
  }

  async create(userId: string, data: CreateProcedureInput) {
    const { tagIds, ...procedureData } = data;

    const procedure = await prisma.procedure.create({
      data: {
        ...procedureData,
        userId,
        tags: tagIds?.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    return { ...procedure, tags: procedure.tags.map((t) => t.tag) };
  }

  async update(id: string, userId: string, data: UpdateProcedureInput) {
    await this.findById(id, userId);
    const { tagIds, ...procedureData } = data;

    const procedure = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.procedureTag.deleteMany({ where: { procedureId: id } });
        if (tagIds.length > 0) {
          await tx.procedureTag.createMany({
            data: tagIds.map((tagId) => ({ procedureId: id, tagId })),
          });
        }
      }

      return tx.procedure.update({
        where: { id },
        data: procedureData,
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      });
    });

    return { ...procedure, tags: procedure.tags.map((t) => t.tag) };
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId);
    await prisma.procedure.delete({ where: { id } });
    return { success: true };
  }

  async toggleFavorite(id: string, userId: string) {
    const procedure = await this.findById(id, userId);
    const updated = await prisma.procedure.update({
      where: { id },
      data: { isFavorite: !procedure.isFavorite },
    });
    return { isFavorite: updated.isFavorite };
  }

  async search(userId: string, query: string, limit = 10) {
    const procedures = await prisma.procedure.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    });

    return procedures.map((proc) => ({
      id: proc.id,
      type: 'procedure' as const,
      title: proc.title,
      description: proc.content.substring(0, 200), // Truncate for preview
      tags: proc.tags.map((t) => t.tag.name),
      categories: proc.category ? [proc.category.name] : [],
      createdAt: proc.createdAt,
      updatedAt: proc.updatedAt,
    }));
  }
}

export const proceduresService = new ProceduresService();
