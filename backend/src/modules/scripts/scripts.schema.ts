import { z } from 'zod';
import { ScriptLang } from '@prisma/client';

export const scriptLanguages = Object.values(ScriptLang);

export const createScriptSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  content: z.string().min(1, 'Script content is required'),
  language: z.nativeEnum(ScriptLang).default(ScriptLang.BASH),
  version: z.string().max(20).default('1.0'),
  isPublic: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  categoryId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().default([]),
  linkedNoteIds: z.array(z.string().uuid()).optional().default([]),
  linkedProcedureIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateScriptSchema = createScriptSchema.partial();

export const scriptQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  language: z.nativeEnum(ScriptLang).optional(),
  categoryId: z.string().uuid().optional(),
  tagIds: z.string().optional(), // comma-separated
  isFavorite: z.string().optional().transform((v) => v === 'true'),
});

export type CreateScriptInput = z.infer<typeof createScriptSchema>;
export type UpdateScriptInput = z.infer<typeof updateScriptSchema>;
export type ScriptQueryInput = z.infer<typeof scriptQuerySchema>;
