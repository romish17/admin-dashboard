import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, getErrorMessage } from '@/services/api';
import { Favorite } from '@/types';
import { PlusIcon, TrashIcon, ArrowTopRightOnSquareIcon, StarIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { FavoriteForm } from '@/components/forms/FavoriteForm';

function FavoriteIcon({ icon }: { icon?: string | null }) {
  if (!icon) return <span className="text-2xl">⭐</span>;

  if (icon.startsWith('http')) {
    return (
      <img
        src={icon}
        alt=""
        className="w-6 h-6 object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return <span className="text-2xl">{icon}</span>;
}

export function FavoritesList() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<Favorite | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  function openModal(favorite?: Favorite) {
    setEditingFavorite(favorite || null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingFavorite(null);
  }

  async function handleSubmit(data: {
    title: string;
    description?: string;
    url?: string;
    icon?: string;
  }) {
    setIsSaving(true);
    try {
      if (editingFavorite) {
        await apiPut(`/favorites/${editingFavorite.id}`, data);
        toast.success('Favorite updated');
      } else {
        await apiPost('/favorites', data);
        toast.success('Favorite added');
      }
      closeModal();
      fetchFavorites();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
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
        <button onClick={() => openModal()} className="btn-primary">
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
          <p className="text-dark-400">No favorites yet. Add your first favorite!</p>
          <button onClick={() => openModal()} className="btn-primary mt-4">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Favorite
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map((fav) => (
            <div key={fav.id} className="card-hover group">
              <div className="flex items-start gap-3">
                <FavoriteIcon icon={fav.icon} />
                <div className="flex-1 min-w-0">
                  {fav.url ? (
                    <a
                      href={fav.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-dark-100 font-medium hover:text-primary-400 flex items-center gap-2"
                    >
                      {fav.title}
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                  ) : fav.targetType && fav.targetId ? (
                    <a
                      href={`/${fav.targetType.toLowerCase()}s/${fav.targetId}`}
                      className="text-dark-100 font-medium hover:text-primary-400"
                    >
                      {fav.title}
                    </a>
                  ) : (
                    <span className="text-dark-100 font-medium">{fav.title}</span>
                  )}
                  {fav.description && (
                    <p className="text-dark-400 text-sm mt-1 line-clamp-2">{fav.description}</p>
                  )}
                  {fav.targetType && (
                    <span className="text-xs text-dark-500 mt-2 inline-block">{fav.targetType}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openModal(fav)}
                    className="p-1 hover:bg-dark-700 rounded"
                  >
                    <PencilIcon className="w-4 h-4 text-dark-500 hover:text-primary-400" />
                  </button>
                  <button
                    onClick={() => deleteFavorite(fav.id)}
                    className="p-1 hover:bg-dark-700 rounded"
                  >
                    <TrashIcon className="w-4 h-4 text-dark-500 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingFavorite ? 'Edit Favorite' : 'Add Favorite'}
        size="sm"
      >
        <FavoriteForm
          favorite={editingFavorite || undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
