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
  FolderIcon,
  RssIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const modules = [
  { name: 'Scripts', href: '/scripts', icon: CodeBracketIcon, color: 'bg-blue-500/20 text-blue-400' },
  { name: 'Notes', href: '/notes', icon: DocumentTextIcon, color: 'bg-emerald-500/20 text-emerald-400' },
  { name: 'Tâches', href: '/todos', icon: ClipboardDocumentListIcon, color: 'bg-amber-500/20 text-amber-400' },
  { name: 'Projets', href: '/projects', icon: FolderIcon, color: 'bg-violet-500/20 text-violet-400' },
  { name: 'Procédures', href: '/procedures', icon: BookOpenIcon, color: 'bg-pink-500/20 text-pink-400' },
  { name: 'Registres', href: '/registries', icon: ComputerDesktopIcon, color: 'bg-orange-500/20 text-orange-400' },
  { name: 'Zabbix', href: '/zabbix', icon: ServerIcon, color: 'bg-red-500/20 text-red-400' },
  { name: 'Flux RSS', href: '/rss', icon: RssIcon, color: 'bg-cyan-500/20 text-cyan-400' },
];

const priorityConfig = {
  URGENT: { icon: ExclamationCircleIcon, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Urgent' },
  HIGH: { icon: ExclamationCircleIcon, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Haute' },
  MEDIUM: { icon: ClockIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Moyenne' },
  LOW: { icon: CheckCircleIcon, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Basse' },
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
          apiGet<Favorite[]>('/favorites').catch(() => []),
          apiGet<Todo[]>('/todos/dashboard').catch(() => []),
          apiGet<RssItem[]>('/rss/items/dashboard').catch(() => []),
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
    <div className="space-y-8">
      {/* Quick access modules */}
      <div>
        <h2 className="text-lg font-semibold text-dark-100 mb-4">Accès rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {modules.map((module) => (
            <Link
              key={module.name}
              to={module.href}
              className="card-hover flex flex-col items-center justify-center py-6 text-center group"
            >
              <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center mb-3', module.color)}>
                <module.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-dark-300 group-hover:text-dark-100">
                {module.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Favorites */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-amber-400" />
              Favoris
            </h2>
            <Link to="/favorites" className="text-sm text-primary-400 hover:text-primary-300">
              Voir tout
            </Link>
          </div>

          {favorites.length === 0 ? (
            <p className="text-dark-400 text-sm">Aucun favori. Ajoutez-en depuis les autres modules !</p>
          ) : (
            <div className="space-y-2">
              {favorites.slice(0, 8).map((favorite) => (
                <a
                  key={favorite.id}
                  href={favorite.url || `/${favorite.targetType?.toLowerCase()}s/${favorite.targetId}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
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
              Tâches prioritaires
            </h2>
            <Link to="/todos" className="text-sm text-primary-400 hover:text-primary-300">
              Voir tout
            </Link>
          </div>

          {todos.length === 0 ? (
            <p className="text-dark-400 text-sm">Aucune tâche prioritaire. Tout est à jour !</p>
          ) : (
            <div className="space-y-2">
              {todos.slice(0, 6).map((todo) => {
                const config = priorityConfig[todo.priority];
                return (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
                  >
                    <div className={clsx('p-1.5 rounded-lg', config.bg)}>
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
              <RssIcon className="w-5 h-5 text-orange-400" />
              Dernières actualités
            </h2>
            <Link to="/rss" className="text-sm text-primary-400 hover:text-primary-300">
              Voir tout
            </Link>
          </div>

          {rssItems.length === 0 ? (
            <p className="text-dark-400 text-sm">Aucun flux RSS configuré. Ajoutez-en dans les paramètres !</p>
          ) : (
            <div className="space-y-3">
              {rssItems.slice(0, 5).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
                >
                  <p className="text-sm text-dark-200 line-clamp-2">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-dark-500">{item.feed.title}</span>
                    {item.publishedAt && (
                      <>
                        <span className="text-dark-600">•</span>
                        <span className="text-xs text-dark-500">
                          {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: fr })}
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
