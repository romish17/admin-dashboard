import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '@/services/api';
import { RssItem } from '@/types';
import { RssIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function RssWidget() {
  const [rssItems, setRssItems] = useState<RssItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGet<RssItem[]>('/rss/items/dashboard')
      .then(setRssItems)
      .catch(() => setRssItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
          <RssIcon className="w-5 h-5 text-orange-400" />
          Dernières actualités
        </h2>
        <Link to="/rss" className="text-sm text-primary-400 hover:text-primary-300">
          Voir tout
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : rssItems.length === 0 ? (
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
                <span className="text-xs text-dark-500">{item.feed?.title}</span>
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
  );
}
