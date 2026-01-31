import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiGet, getErrorMessage } from '@/services/api';
import { SearchResponse, SearchResult } from '@/types';
import {
  CodeBracketIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  ServerIcon,
  RssIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const typeConfig: Record<string, { icon: typeof CodeBracketIcon; color: string; label: string; path: string }> = {
  script: { icon: CodeBracketIcon, color: 'text-blue-400', label: 'Script', path: '/scripts' },
  note: { icon: DocumentTextIcon, color: 'text-green-400', label: 'Note', path: '/notes' },
  todo: { icon: ClipboardDocumentListIcon, color: 'text-yellow-400', label: 'Todo', path: '/todos' },
  procedure: { icon: BookOpenIcon, color: 'text-purple-400', label: 'Procedure', path: '/procedures' },
  registry: { icon: ComputerDesktopIcon, color: 'text-orange-400', label: 'Registry', path: '/registries' },
  zabbix: { icon: ServerIcon, color: 'text-red-400', label: 'Zabbix', path: '/zabbix' },
  rss: { icon: RssIcon, color: 'text-cyan-400', label: 'RSS', path: '/rss' },
};

export function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<Record<string, SearchResult[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query]);

  async function performSearch() {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { q: query };
      if (selectedType) params.modules = selectedType;
      const response = await apiGet<SearchResponse>('/search', params);
      setResults(response.results);
      setGroupedResults(response.groupedResults);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  const filteredResults = selectedType
    ? results.filter(r => r.type === selectedType)
    : results;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Search Results</h1>
        <p className="text-dark-400">
          {results.length} results for "{query}"
        </p>
      </div>

      {/* Search input */}
      <div className="card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newQuery = formData.get('query') as string;
            if (newQuery) {
              setSearchParams({ q: newQuery });
            }
          }}
        >
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="Search everything..."
              className="input pl-10"
            />
          </div>
        </form>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType('')}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            !selectedType ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          )}
        >
          All ({results.length})
        </button>
        {Object.entries(groupedResults).map(([type, items]) => {
          const config = typeConfig[type];
          if (!config) return null;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                selectedType === type ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              )}
            >
              <config.icon className={clsx('w-4 h-4', config.color)} />
              {config.label} ({items.length})
            </button>
          );
        })}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="card text-center py-12">
          <MagnifyingGlassIcon className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No results found. Try a different search term.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResults.map((result) => {
            const config = typeConfig[result.type];
            if (!config) return null;
            const Icon = config.icon;

            return (
              <Link
                key={`${result.type}-${result.id}`}
                to={`${config.path}/${result.id}`}
                className="card-hover flex items-start gap-4"
              >
                <div className={clsx('p-2 rounded-lg bg-dark-700')}>
                  <Icon className={clsx('w-5 h-5', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-dark-100">{result.title}</h3>
                    <span className={clsx('text-xs px-2 py-0.5 rounded', config.color, 'bg-dark-700')}>
                      {config.label}
                    </span>
                  </div>
                  {result.description && (
                    <p className="text-dark-400 text-sm mt-1 line-clamp-2">{result.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-dark-500">
                    {result.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                    {result.categories.slice(0, 2).map((cat) => (
                      <span key={cat} className="text-primary-400">{cat}</span>
                    ))}
                    <span>{formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
