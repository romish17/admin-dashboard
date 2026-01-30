import { Request } from 'express';
import { Role } from '@prisma/client';

// User payload in JWT
export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

// Extended Request with user info
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// Search
export interface SearchParams {
  query: string;
  modules?: string[];
  tags?: string[];
  categories?: string[];
  page?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  type: ModuleType;
  title: string;
  description?: string;
  tags: string[];
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
  score?: number;
}

export type ModuleType =
  | 'script'
  | 'registry'
  | 'zabbix'
  | 'note'
  | 'procedure'
  | 'todo'
  | 'rss';

// Permissions
export type Permission =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'execute'
  | 'export'
  | 'sync'
  | 'refresh';

export interface RolePermissions {
  [module: string]: Permission[];
}

export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  ADMIN: {
    scripts: ['create', 'read', 'update', 'delete', 'execute'],
    registries: ['create', 'read', 'update', 'delete', 'export'],
    zabbix: ['create', 'read', 'update', 'delete', 'sync'],
    notes: ['create', 'read', 'update', 'delete'],
    procedures: ['create', 'read', 'update', 'delete'],
    todos: ['create', 'read', 'update', 'delete'],
    favorites: ['create', 'read', 'update', 'delete'],
    rss: ['create', 'read', 'update', 'delete', 'refresh'],
    users: ['create', 'read', 'update', 'delete'],
    categories: ['create', 'read', 'update', 'delete'],
    tags: ['create', 'read', 'update', 'delete'],
  },
  USER: {
    scripts: ['create', 'read', 'update', 'delete'],
    registries: ['create', 'read', 'update', 'delete', 'export'],
    zabbix: ['create', 'read', 'update', 'delete'],
    notes: ['create', 'read', 'update', 'delete'],
    procedures: ['create', 'read', 'update', 'delete'],
    todos: ['create', 'read', 'update', 'delete'],
    favorites: ['create', 'read', 'update', 'delete'],
    rss: ['create', 'read', 'update', 'delete', 'refresh'],
    categories: ['create', 'read', 'update', 'delete'],
    tags: ['create', 'read', 'update', 'delete'],
  },
  READONLY: {
    scripts: ['read'],
    registries: ['read'],
    zabbix: ['read'],
    notes: ['read'],
    procedures: ['read'],
    todos: ['read'],
    favorites: ['read'],
    rss: ['read'],
    categories: ['read'],
    tags: ['read'],
  },
};
