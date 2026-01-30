import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  isMarkdown: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  categoryId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateNoteSchema = createNoteSchema.partial();

export const noteQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isPinned: z.string().optional().transform((v) => v === 'true'),
  isFavorite: z.string().optional().transform((v) => v === 'true'),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteQueryInput = z.infer<typeof noteQuerySchema>;
