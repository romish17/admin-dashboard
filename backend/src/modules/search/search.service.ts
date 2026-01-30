import { scriptsService } from '../scripts/scripts.service.js';
import { registriesService } from '../registries/registries.service.js';
import { notesService } from '../notes/notes.service.js';
import { todosService } from '../todos/todos.service.js';
import { proceduresService } from '../procedures/procedures.service.js';
import { zabbixService } from '../zabbix/zabbix.service.js';
import { rssService } from '../rss/rss.service.js';
import { SearchResult, ModuleType } from '../../types/index.js';
import { redis, REDIS_KEYS, REDIS_TTL } from '../../config/redis.js';
import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  modules: z.string().optional(), // comma-separated: script,note,todo
  tags: z.string().optional(), // comma-separated
  categories: z.string().optional(), // comma-separated
  limit: z.string().optional().default('50').transform(Number),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

const MODULE_SEARCHERS: Record<ModuleType, (userId: string, query: string, limit: number) => Promise<SearchResult[]>> = {
  script: scriptsService.search.bind(scriptsService),
  registry: registriesService.search.bind(registriesService),
  note: notesService.search.bind(notesService),
  todo: todosService.search.bind(todosService),
  procedure: proceduresService.search.bind(proceduresService),
  zabbix: zabbixService.search.bind(zabbixService),
  rss: rssService.search.bind(rssService),
};

class SearchService {
  async globalSearch(userId: string, query: SearchQueryInput): Promise<{
    results: SearchResult[];
    groupedResults: Record<ModuleType, SearchResult[]>;
    total: number;
  }> {
    const { q, modules, tags, categories, limit } = query;

    // Check cache
    const cacheKey = REDIS_KEYS.searchCache(q, userId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return this.filterResults(parsed, { modules, tags, categories, limit });
    }

    // Determine which modules to search
    const modulesToSearch = modules
      ? (modules.split(',') as ModuleType[])
      : (Object.keys(MODULE_SEARCHERS) as ModuleType[]);

    // Search all modules in parallel
    const searchPromises = modulesToSearch.map(async (module) => {
      const searcher = MODULE_SEARCHERS[module];
      if (!searcher) return [];
      try {
        return await searcher(userId, q, Math.ceil(limit / modulesToSearch.length));
      } catch {
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    const allResults = searchResults.flat();

    // Sort by relevance (simple: title match first, then by date)
    allResults.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(q.toLowerCase()) ? 1 : 0;
      const bExact = b.title.toLowerCase().includes(q.toLowerCase()) ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Cache results
    await redis.setex(cacheKey, REDIS_TTL.searchCache, JSON.stringify(allResults));

    return this.filterResults(allResults, { modules, tags, categories, limit });
  }

  private filterResults(
    results: SearchResult[],
    filters: { modules?: string; tags?: string; categories?: string; limit: number }
  ) {
    let filtered = [...results];

    // Filter by tags
    if (filters.tags) {
      const filterTags = filters.tags.split(',').map((t) => t.toLowerCase());
      filtered = filtered.filter((r) =>
        r.tags.some((t) => filterTags.includes(t.toLowerCase()))
      );
    }

    // Filter by categories
    if (filters.categories) {
      const filterCats = filters.categories.split(',').map((c) => c.toLowerCase());
      filtered = filtered.filter((r) =>
        r.categories.some((c) => filterCats.includes(c.toLowerCase()))
      );
    }

    // Limit results
    filtered = filtered.slice(0, filters.limit);

    // Group by type
    const groupedResults = filtered.reduce<Record<ModuleType, SearchResult[]>>((acc, result) => {
      if (!acc[result.type]) acc[result.type] = [];
      acc[result.type].push(result);
      return acc;
    }, {} as Record<ModuleType, SearchResult[]>);

    return {
      results: filtered,
      groupedResults,
      total: filtered.length,
    };
  }

  async getSearchSuggestions(userId: string, query: string): Promise<string[]> {
    // Get recent searches or common terms
    const results = await this.globalSearch(userId, { q: query, limit: 10 });

    // Extract unique titles as suggestions
    const suggestions = [...new Set(results.results.map((r) => r.title))].slice(0, 5);

    return suggestions;
  }
}

export const searchService = new SearchService();
