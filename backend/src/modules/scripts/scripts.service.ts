import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../middleware/errorHandler.js';
import { PaginationParams, paginatedResponse, getPrismaSkipTake } from '../../utils/pagination.js';
import { CreateScriptInput, UpdateScriptInput, ScriptQueryInput } from './scripts.schema.js';

class ScriptsService {
  async findAll(userId: string, query: ScriptQueryInput, pagination: PaginationParams) {
    const where: Record<string, unknown> = { userId };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.language) {
      where.language = query.language;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.isFavorite !== undefined) {
      where.isFavorite = query.isFavorite;
    }

    if (query.tagIds) {
      const tagIdArray = query.tagIds.split(',');
      where.tags = {
        some: {
          tagId: { in: tagIdArray },
        },
      };
    }

    const [scripts, total] = await Promise.all([
      prisma.script.findMany({
        where,
        ...getPrismaSkipTake(pagination),
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
          tags: {
            include: {
              tag: { select: { id: true, name: true, color: true } },
            },
          },
          _count: {
            select: { linkedNotes: true, linkedProcedures: true },
          },
        },
      }),
      prisma.script.count({ where }),
    ]);

    const formattedScripts = scripts.map((script) => ({
      ...script,
      tags: script.tags.map((t) => t.tag),
    }));

    return paginatedResponse(formattedScripts, total, pagination);
  }

  async findById(id: string, userId: string) {
    const script = await prisma.script.findFirst({
      where: { id, userId },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        linkedNotes: {
          include: {
            note: {
              select: { id: true, title: true },
            },
          },
        },
        linkedProcedures: {
          include: {
            procedure: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!script) {
      throw new NotFoundError('Script', id);
    }

    return {
      ...script,
      tags: script.tags.map((t) => t.tag),
      linkedNotes: script.linkedNotes.map((n) => n.note),
      linkedProcedures: script.linkedProcedures.map((p) => p.procedure),
    };
  }

  async create(userId: string, data: CreateScriptInput) {
    const { tagIds, linkedNoteIds, linkedProcedureIds, ...scriptData } = data;

    const script = await prisma.script.create({
      data: {
        ...scriptData,
        userId,
        tags: tagIds?.length
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
        linkedNotes: linkedNoteIds?.length
          ? {
              create: linkedNoteIds.map((noteId) => ({ noteId })),
            }
          : undefined,
        linkedProcedures: linkedProcedureIds?.length
          ? {
              create: linkedProcedureIds.map((procedureId) => ({ procedureId })),
            }
          : undefined,
      },
      include: {
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    return {
      ...script,
      tags: script.tags.map((t) => t.tag),
    };
  }

  async update(id: string, userId: string, data: UpdateScriptInput) {
    // Check if script exists and belongs to user
    await this.findById(id, userId);

    const { tagIds, linkedNoteIds, linkedProcedureIds, ...scriptData } = data;

    // Update script with transaction for tag/link updates
    const script = await prisma.$transaction(async (tx) => {
      // Update tags if provided
      if (tagIds !== undefined) {
        await tx.scriptTag.deleteMany({ where: { scriptId: id } });
        if (tagIds.length > 0) {
          await tx.scriptTag.createMany({
            data: tagIds.map((tagId) => ({ scriptId: id, tagId })),
          });
        }
      }

      // Update linked notes if provided
      if (linkedNoteIds !== undefined) {
        await tx.scriptNote.deleteMany({ where: { scriptId: id } });
        if (linkedNoteIds.length > 0) {
          await tx.scriptNote.createMany({
            data: linkedNoteIds.map((noteId) => ({ scriptId: id, noteId })),
          });
        }
      }

      // Update linked procedures if provided
      if (linkedProcedureIds !== undefined) {
        await tx.scriptProcedure.deleteMany({ where: { scriptId: id } });
        if (linkedProcedureIds.length > 0) {
          await tx.scriptProcedure.createMany({
            data: linkedProcedureIds.map((procedureId) => ({ scriptId: id, procedureId })),
          });
        }
      }

      // Update script data
      return tx.script.update({
        where: { id },
        data: scriptData,
        include: {
          category: true,
          tags: {
            include: { tag: true },
          },
        },
      });
    });

    return {
      ...script,
      tags: script.tags.map((t) => t.tag),
    };
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId);

    await prisma.script.delete({ where: { id } });

    return { success: true };
  }

  async toggleFavorite(id: string, userId: string) {
    const script = await this.findById(id, userId);

    const updated = await prisma.script.update({
      where: { id },
      data: { isFavorite: !script.isFavorite },
    });

    return { isFavorite: updated.isFavorite };
  }

  // For global search
  async search(userId: string, query: string, limit = 10) {
    const scripts = await prisma.script.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: { name: true },
        },
        tags: {
          include: {
            tag: { select: { name: true } },
          },
        },
      },
    });

    return scripts.map((script) => ({
      id: script.id,
      type: 'script' as const,
      title: script.title,
      description: script.description,
      tags: script.tags.map((t) => t.tag.name),
      categories: script.category ? [script.category.name] : [],
      createdAt: script.createdAt,
      updatedAt: script.updatedAt,
    }));
  }
}

export const scriptsService = new ScriptsService();
