import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../middleware/errorHandler.js';
import { PaginationParams, paginatedResponse, getPrismaSkipTake } from '../../utils/pagination.js';
import { CreateNoteInput, UpdateNoteInput, NoteQueryInput } from './notes.schema.js';

class NotesService {
  async findAll(userId: string, query: NoteQueryInput, pagination: PaginationParams) {
    const where: Record<string, unknown> = { userId };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isPinned !== undefined) where.isPinned = query.isPinned;
    if (query.isFavorite !== undefined) where.isFavorite = query.isFavorite;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
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
      prisma.note.count({ where }),
    ]);

    return paginatedResponse(
      notes.map((n) => ({ ...n, tags: n.tags.map((t) => t.tag) })),
      total,
      pagination
    );
  }

  async findById(id: string, userId: string) {
    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: {
        category: true,
        tags: { include: { tag: true } },
        linkedScripts: { include: { script: { select: { id: true, title: true } } } },
        linkedZabbix: { include: { zabbixItem: { select: { id: true, name: true } } } },
        linkedProcedures: { include: { procedure: { select: { id: true, title: true } } } },
      },
    });

    if (!note) throw new NotFoundError('Note', id);

    return {
      ...note,
      tags: note.tags.map((t) => t.tag),
      linkedScripts: note.linkedScripts.map((s) => s.script),
      linkedZabbix: note.linkedZabbix.map((z) => z.zabbixItem),
      linkedProcedures: note.linkedProcedures.map((p) => p.procedure),
    };
  }

  async create(userId: string, data: CreateNoteInput) {
    const { tagIds, ...noteData } = data;

    const note = await prisma.note.create({
      data: {
        ...noteData,
        userId,
        tags: tagIds?.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    return { ...note, tags: note.tags.map((t) => t.tag) };
  }

  async update(id: string, userId: string, data: UpdateNoteInput) {
    await this.findById(id, userId);
    const { tagIds, ...noteData } = data;

    const note = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.noteTag.deleteMany({ where: { noteId: id } });
        if (tagIds.length > 0) {
          await tx.noteTag.createMany({
            data: tagIds.map((tagId) => ({ noteId: id, tagId })),
          });
        }
      }

      return tx.note.update({
        where: { id },
        data: noteData,
        include: { category: true, tags: { include: { tag: true } } },
      });
    });

    return { ...note, tags: note.tags.map((t) => t.tag) };
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId);
    await prisma.note.delete({ where: { id } });
    return { success: true };
  }

  async toggleFavorite(id: string, userId: string) {
    const note = await this.findById(id, userId);
    const updated = await prisma.note.update({
      where: { id },
      data: { isFavorite: !note.isFavorite },
    });
    return { isFavorite: updated.isFavorite };
  }

  async togglePinned(id: string, userId: string) {
    const note = await this.findById(id, userId);
    const updated = await prisma.note.update({
      where: { id },
      data: { isPinned: !note.isPinned },
    });
    return { isPinned: updated.isPinned };
  }

  async search(userId: string, query: string, limit = 10) {
    const notes = await prisma.note.findMany({
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

    return notes.map((note) => ({
      id: note.id,
      type: 'note' as const,
      title: note.title,
      description: note.content.substring(0, 200),
      tags: note.tags.map((t) => t.tag.name),
      categories: note.category ? [note.category.name] : [],
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));
  }
}

export const notesService = new NotesService();
