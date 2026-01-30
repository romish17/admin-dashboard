import { z } from 'zod';
import { PaginationParams, PaginatedResponse } from '../types/index.js';

export const paginationQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export function parsePagination(query: unknown): PaginationParams {
  const parsed = paginationQuerySchema.parse(query);
  return {
    page: Math.max(1, parsed.page),
    limit: Math.min(100, Math.max(1, parsed.limit)),
    sortBy: parsed.sortBy,
    sortOrder: parsed.sortOrder,
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export function getPrismaSkipTake(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  };
}

export function getPrismaOrderBy(params: PaginationParams, defaultField = 'createdAt') {
  const field = params.sortBy || defaultField;
  return {
    [field]: params.sortOrder || 'desc',
  };
}
