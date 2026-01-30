import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost, getErrorMessage } from '@/services/api';
import { Script, PaginatedResponse, Category, Tag } from '@/types';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  StarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const languageColors: Record<string, string> = {
  BASH: 'bg-green-500/20 text-green-400',
  POWERSHELL: 'bg-blue-500/20 text-blue-400',
  PYTHON: 'bg-yellow-500/20 text-yellow-400',
  JAVASCRIPT: 'bg-orange-500/20 text-orange-400',
  SQL: 'bg-purple-500/20 text-purple-400',
  OTHER: 'bg-gray-500/20 text-gray-400',
};

export function ScriptsList() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [_tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  useEffect(() => {
    fetchScripts();
    fetchFilters();
  }, [search, selectedCategory, selectedLanguage]);

  async function fetchScripts() {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedLanguage) params.language = selectedLanguage;

      const response = await apiGet<PaginatedResponse<Script>>('/scripts', params);
      setScripts(response.data);
      setMeta(response.meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchFilters() {
    try {
      const [cats, tgs] = await Promise.all([
        apiGet<Category[]>('/categories'),
        apiGet<Tag[]>('/tags'),
      ]);
      setCategories(cats);
      setTags(tgs);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  }

  async function toggleFavorite(id: string) {
    try {
      await apiPost(`/scripts/${id}/favorite`);
      setScripts(scripts.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Scripts</h1>
          <p className="text-dark-400">Manage your PowerShell, Bash, and other scripts</p>
        </div>
        <Link to="/scripts/new" className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Script
        </Link>
      </div>

      {/* Search and filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search scripts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx('btn-secondary', showFilters && 'bg-dark-600')}
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-dark-700">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input w-auto"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="input w-auto"
            >
              <option value="">All Languages</option>
              <option value="BASH">Bash</option>
              <option value="POWERSHELL">PowerShell</option>
              <option value="PYTHON">Python</option>
              <option value="JAVASCRIPT">JavaScript</option>
              <option value="SQL">SQL</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        )}
      </div>

      {/* Scripts list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : scripts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-dark-400">No scripts found. Create your first script!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {scripts.map((script) => (
            <Link
              key={script.id}
              to={`/scripts/${script.id}`}
              className="card-hover group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-dark-100 group-hover:text-primary-400 truncate">
                      {script.title}
                    </h3>
                    <span className={clsx('badge', languageColors[script.language])}>
                      {script.language}
                    </span>
                  </div>
                  {script.description && (
                    <p className="text-dark-400 text-sm mt-1 line-clamp-2">{script.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    {script.category && (
                      <span
                        className="badge"
                        style={{ backgroundColor: `${script.category.color}20`, color: script.category.color }}
                      >
                        {script.category.name}
                      </span>
                    )}
                    {script.tags.slice(0, 3).map((tag) => (
                      <span key={tag.id} className="text-xs text-dark-500">#{tag.name}</span>
                    ))}
                    <span className="text-xs text-dark-500">
                      Updated {formatDistanceToNow(new Date(script.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(script.id);
                  }}
                  className="p-2 hover:bg-dark-700 rounded-lg"
                >
                  {script.isFavorite ? (
                    <StarSolidIcon className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <StarIcon className="w-5 h-5 text-dark-500 hover:text-yellow-400" />
                  )}
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination info */}
      {meta.total > 0 && (
        <div className="text-center text-sm text-dark-400">
          Showing {scripts.length} of {meta.total} scripts
        </div>
      )}
    </div>
  );
}
