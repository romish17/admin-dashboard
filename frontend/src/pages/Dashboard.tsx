import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '@/services/api';
import { Todo, Favorite, RssItem } from '@/types';
import {
  CodeBracketIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  ServerIcon,
  StarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const modules = [
  { name: 'Scripts', href: '/scripts', icon: CodeBracketIcon, color: 'bg-blue-500/20 text-blue-400' },
  { name: 'Notes', href: '/notes', icon: DocumentTextIcon, color: 'bg-green-500/20 text-green-400' },
  { name: 'Todos', href: '/todos', icon: ClipboardDocumentListIcon, color: 'bg-yellow-500/20 text-yellow-400' },
  { name: 'Procedures', href: '/procedures', icon: BookOpenIcon, color: 'bg-purple-500/20 text-purple-400' },
  { name: 'Registries', href: '/registries', icon: ComputerDesktopIcon, color: 'bg-orange-500/20 text-orange-400' },
  { name: 'Zabbix', href: '/zabbix', icon: ServerIcon, color: 'bg-red-500/20 text-red-400' },
];

const priorityConfig = {
  URGENT: { icon: ExclamationCircleIcon, color: 'text-red-400', bg: 'bg-red-500/20' },
  HIGH: { icon: ExclamationCircleIcon, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  MEDIUM: { icon: ClockIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  LOW: { icon: CheckCircleIcon, color: 'text-green-400', bg: 'bg-green-500/20' },
};

export function Dashboard() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [rssItems, setRssItems] = useState<RssItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [favoritesData, todosData, rssData] = await Promise.all([
          apiGet<Favorite[]>('/favorites'),
          apiGet<Todo[]>('/todos/dashboard'),
          apiGet<RssItem[]>('/rss/items/dashboard'),
        ]);
        setFavorites(favoritesData);
        setTodos(todosData);
        setRssItems(rssData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="card">
        <h1 className="text-2xl font-bold text-dark-100">Welcome to AdminDashboard</h1>
        <p className="mt-1 text-dark-400">Your personal productivity cockpit. Quick access to all your tools.</p>
      </div>

      {/* Quick access modules */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {modules.map((module) => (
          <Link
            key={module.name}
            to={module.href}
            className="card-hover flex flex-col items-center justify-center py-6 text-center group"
          >
            <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center mb-3', module.color)}>
              <module.icon className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-dark-200 group-hover:text-dark-100">
              {module.name}
            </span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Favorites */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-yellow-400" />
              Favorites
            </h2>
            <Link to="/favorites" className="text-sm text-primary-400 hover:text-primary-300">
              View all
            </Link>
          </div>

          {favorites.length === 0 ? (
            <p className="text-dark-400 text-sm">No favorites yet. Add some from other modules!</p>
          ) : (
            <div className="space-y-2">
              {favorites.slice(0, 8).map((favorite) => (
                <a
                  key={favorite.id}
                  href={favorite.url || `/${favorite.targetType?.toLowerCase()}s/${favorite.targetId}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700 transition-colors"
                  target={favorite.url ? '_blank' : undefined}
                  rel={favorite.url ? 'noopener noreferrer' : undefined}
                >
                  <span className="text-lg">{favorite.icon || '⭐'}</span>
                  <span className="text-sm text-dark-200 truncate flex-1">{favorite.title}</span>
                  {favorite.url && (
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-dark-500" />
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Todos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-5 h-5 text-primary-400" />
              Priority Tasks
            </h2>
            <Link to="/todos" className="text-sm text-primary-400 hover:text-primary-300">
              View all
            </Link>
          </div>

          {todos.length === 0 ? (
            <p className="text-dark-400 text-sm">No priority tasks. All caught up!</p>
          ) : (
            <div className="space-y-2">
              {todos.slice(0, 6).map((todo) => {
                const config = priorityConfig[todo.priority];
                return (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <div className={clsx('p-1 rounded', config.bg)}>
                      <config.icon className={clsx('w-4 h-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dark-200 truncate">{todo.title}</p>
                      {todo.project && (
                        <p className="text-xs text-dark-500">{todo.project.name}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RSS Feed */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z" />
              </svg>
              Latest News
            </h2>
            <Link to="/rss" className="text-sm text-primary-400 hover:text-primary-300">
              View all
            </Link>
          </div>

          {rssItems.length === 0 ? (
            <p className="text-dark-400 text-sm">No RSS feeds configured. Add some in Settings!</p>
          ) : (
            <div className="space-y-3">
              {rssItems.slice(0, 5).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <p className="text-sm text-dark-200 line-clamp-2">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-dark-500">{item.feed.title}</span>
                    {item.publishedAt && (
                      <>
                        <span className="text-dark-600">•</span>
                        <span className="text-xs text-dark-500">
                          {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                        </span>
                      </>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
