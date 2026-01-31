import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '@/services/api';
import { RssItem } from '@/types';
import { Rss } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Rss className="w-5 h-5 text-orange-400" />
            Dernières actualités
          </CardTitle>
          <Link to="/rss" className="text-sm text-primary hover:text-primary/80">
            Voir tout
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : rssItems.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun flux RSS configuré. Ajoutez-en dans les paramètres !</p>
        ) : (
          <div className="space-y-3">
            {rssItems.slice(0, 5).map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <p className="text-sm text-foreground line-clamp-2">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{item.feed?.title}</span>
                  {item.publishedAt && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: fr })}
                      </span>
                    </>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
