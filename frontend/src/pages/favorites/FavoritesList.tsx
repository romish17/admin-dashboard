import { useEffect, useState } from 'react';
import { apiGet, apiDelete, getErrorMessage } from '@/services/api';
import { Favorite } from '@/types';
import { PlusIcon, TrashIcon, ArrowTopRightOnSquareIcon, StarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function FavoritesList() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  async function fetchFavorites() {
    setIsLoading(true);
    try {
      const data = await apiGet<Favorite[]>('/favorites');
      setFavorites(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteFavorite(id: string) {
    if (!confirm('Remove this favorite?')) return;
    try {
      await apiDelete(`/favorites/${id}`);
      setFavorites(favorites.filter(f => f.id !== id));
      toast.success('Favorite removed');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Favorites</h1>
          <p className="text-dark-400">Quick access to your most used items</p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Favorite
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="card text-center py-12">
          <StarIcon className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No favorites yet. Star items from other modules!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map((fav) => (
            <div key={fav.id} className="card-hover group">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{fav.icon || '⭐'}</span>
                <div className="flex-1 min-w-0">
                  <a
                    href={fav.url || `/${fav.targetType?.toLowerCase()}s/${fav.targetId}`}
                    target={fav.url ? '_blank' : undefined}
                    rel={fav.url ? 'noopener noreferrer' : undefined}
                    className="text-dark-100 font-medium hover:text-primary-400 flex items-center gap-2"
                  >
                    {fav.title}
                    {fav.url && <ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                  </a>
                  {fav.description && (
                    <p className="text-dark-400 text-sm mt-1 line-clamp-2">{fav.description}</p>
                  )}
                  {fav.targetType && (
                    <span className="text-xs text-dark-500 mt-2 inline-block">{fav.targetType}</span>
                  )}
                </div>
                <button
                  onClick={() => deleteFavorite(fav.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-dark-700 rounded transition-opacity"
                >
                  <TrashIcon className="w-4 h-4 text-dark-500 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
