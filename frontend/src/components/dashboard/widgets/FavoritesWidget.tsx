import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '@/services/api';
import { Favorite } from '@/types';
import { StarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

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
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
          <StarIcon className="w-5 h-5 text-amber-400" />
          Favoris
        </h2>
        <Link to="/favorites" className="text-sm text-primary-400 hover:text-primary-300">
          Voir tout
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : favorites.length === 0 ? (
        <p className="text-dark-400 text-sm">Aucun favori. Ajoutez-en depuis les autres modules !</p>
      ) : (
        <div className="space-y-1">
          {favorites.slice(0, 8).map((favorite) => (
            <a
              key={favorite.id}
              href={favorite.url || `/${favorite.targetType?.toLowerCase()}s/${favorite.targetId}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
              target={favorite.url ? '_blank' : undefined}
              rel={favorite.url ? 'noopener noreferrer' : undefined}
            >
              <FavoriteIcon icon={favorite.icon} />
              <span className="text-sm text-dark-200 truncate flex-1">{favorite.title}</span>
              {favorite.url && (
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-dark-500" />
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
