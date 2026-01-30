import { z } from 'zod';
import { RegistryType } from '@prisma/client';

export const createRegistrySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')).transform(v => v || undefined),
  keyPath: z.string().min(1, 'Registry key path is required'),
  valueName: z.string().min(1, 'Value name is required'),
  valueData: z.string(),
  valueType: z.nativeEnum(RegistryType).default(RegistryType.REG_SZ),
  isEnabled: z.boolean().default(true),
  isFavorite: z.boolean().default(false),
  categoryId: z.string().uuid().optional().nullable().or(z.literal('')).transform(v => v || null),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateRegistrySchema = createRegistrySchema.partial();

export const registryQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'keyPath']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  valueType: z.nativeEnum(RegistryType).optional(),
  categoryId: z.string().uuid().optional(),
  isFavorite: z.string().optional().transform((v) => v === 'true'),
});

export const exportRegistrySchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one registry entry is required'),
});

export type CreateRegistryInput = z.infer<typeof createRegistrySchema>;
export type UpdateRegistryInput = z.infer<typeof updateRegistrySchema>;
export type RegistryQueryInput = z.infer<typeof registryQuerySchema>;
export type ExportRegistryInput = z.infer<typeof exportRegistrySchema>;
