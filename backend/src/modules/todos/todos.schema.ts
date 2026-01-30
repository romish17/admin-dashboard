import { z } from 'zod';
import { TodoStatus, TodoPriority, ProjectStatus } from '@prisma/client';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ACTIVE),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TodoStatus).default(TodoStatus.TODO),
  priority: z.nativeEnum(TodoPriority).default(TodoPriority.MEDIUM),
  dueDate: z.string().datetime().optional().nullable(),
  isPinned: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  projectId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateTodoSchema = createTodoSchema.partial();

export const todoQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  status: z.nativeEnum(TodoStatus).optional(),
  priority: z.nativeEnum(TodoPriority).optional(),
  projectId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  isPinned: z.string().optional().transform((v) => v === 'true'),
  isFavorite: z.string().optional().transform((v) => v === 'true'),
  showCompleted: z.string().optional().transform((v) => v === 'true'),
});

export const bulkUpdateTodosSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.nativeEnum(TodoStatus).optional(),
  priority: z.nativeEnum(TodoPriority).optional(),
  projectId: z.string().uuid().optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type TodoQueryInput = z.infer<typeof todoQuerySchema>;
export type BulkUpdateTodosInput = z.infer<typeof bulkUpdateTodosSchema>;
