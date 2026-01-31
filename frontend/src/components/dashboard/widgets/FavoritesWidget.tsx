import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '@/services/api';
import { Favorite } from '@/types';
import { Star, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function FavoriteIcon({ icon }: { icon?: string | null }) {
  if (!icon) return <span className="text-lg">⭐</span>;
  if (icon.startsWith('http')) {
    return <img src={icon} alt="" className="w-5 h-5 object-contain" />;
  }
  return <span className="text-lg">{icon}</span>;
}

export function FavoritesWidget() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGet<Favorite[]>('/favorites')
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            Favoris
          </CardTitle>
          <Link to="/favorites" className="text-sm text-primary hover:text-primary/80">
            Voir tout
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : favorites.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun favori. Ajoutez-en depuis les autres modules !</p>
        ) : (
          <div className="space-y-1">
            {favorites.slice(0, 8).map((favorite) => (
              <a
                key={favorite.id}
                href={favorite.url || `/${favorite.targetType?.toLowerCase()}s/${favorite.targetId}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                target={favorite.url ? '_blank' : undefined}
                rel={favorite.url ? 'noopener noreferrer' : undefined}
              >
                <FavoriteIcon icon={favorite.icon} />
                <span className="text-sm text-foreground truncate flex-1">{favorite.title}</span>
                {favorite.url && (
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                )}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
