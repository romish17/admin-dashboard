// User & Auth
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: 'ADMIN' | 'USER' | 'READONLY';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Pagination
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Section enum for scoping categories and tags
export type Section = 'SCRIPTS' | 'REGISTRIES' | 'ZABBIX' | 'NOTES' | 'PROCEDURES' | 'TODOS' | 'RSS';

// Category & Tag
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  section?: Section | null;
  totalItems?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  section?: Section | null;
  usageCount?: number;
}

// Script
export interface Script {
  id: string;
  title: string;
  description?: string;
  content: string;
  language: 'BASH' | 'POWERSHELL' | 'PYTHON' | 'JAVASCRIPT' | 'SQL' | 'OTHER';
  version: string;
  isPublic: boolean;
  isFavorite: boolean;
  category?: Category;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

// Registry Entry
export interface RegistryEntry {
  id: string;
  name: string;
  description?: string;
  keyPath: string;
  valueName: string;
  valueData: string;
  valueType: 'REG_SZ' | 'REG_EXPAND_SZ' | 'REG_MULTI_SZ' | 'REG_DWORD' | 'REG_QWORD' | 'REG_BINARY' | 'REG_NONE';
  isEnabled: boolean;
  isFavorite: boolean;
  category?: Category;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

// Note
export interface Note {
  id: string;
  title: string;
  content: string;
  isMarkdown: boolean;
  isPinned: boolean;
  isFavorite: boolean;
  category?: Category;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

// Procedure (Note-like with WYSIWYG content)
export interface Procedure {
  id: string;
  title: string;
  content: string; // Rich HTML content from WYSIWYG editor
  isPinned: boolean;
  isFavorite: boolean;
  category?: Category;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

// Todo & Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  stats?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  isPinned: boolean;
  isFavorite: boolean;
  completedAt?: string;
  project?: Pick<Project, 'id' | 'name' | 'color'>;
  category?: Category;
  tags: Tag[];
  subtasks?: Todo[];
  createdAt: string;
  updatedAt: string;
}

// Zabbix
export interface ZabbixItem {
  id: string;
  name: string;
  description?: string;
  itemType: 'ITEM' | 'TRIGGER' | 'TEMPLATE' | 'HOST' | 'HOSTGROUP' | 'ACTION' | 'MACRO' | 'OTHER';
  content: Record<string, unknown>;
  version?: string;
  zabbixId?: string;
  isFavorite: boolean;
  category?: Category;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

// Favorite
export interface Favorite {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  url?: string;
  targetType?: 'SCRIPT' | 'REGISTRY' | 'ZABBIX' | 'NOTE' | 'PROCEDURE' | 'TODO' | 'PROJECT' | 'RSS_FEED' | 'MODULE';
  targetId?: string;
  position: number;
  resolvedTarget?: { id: string; title?: string; name?: string };
}

// RSS
export interface RssFeed {
  id: string;
  title: string;
  description?: string;
  url: string;
  siteUrl?: string;
  icon?: string;
  refreshRate: number;
  isActive: boolean;
  showOnHome: boolean;
  lastFetchedAt?: string;
  category?: Category;
  unreadCount?: number;
}

export interface RssItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  author?: string;
  imageUrl?: string;
  isRead: boolean;
  isStarred: boolean;
  publishedAt?: string;
  feed: Pick<RssFeed, 'id' | 'title' | 'icon'>;
  createdAt: string;
}

// Search
export interface SearchResult {
  id: string;
  type: 'script' | 'registry' | 'zabbix' | 'note' | 'procedure' | 'todo' | 'rss';
  title: string;
  description?: string;
  tags: string[];
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchResponse {
  results: SearchResult[];
  groupedResults: Record<string, SearchResult[]>;
  total: number;
}
