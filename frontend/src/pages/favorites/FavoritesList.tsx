import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, getErrorMessage } from '@/services/api';
import { Favorite } from '@/types';
import { Plus, Trash2, ExternalLink, Star, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
          <h1 className="text-2xl font-bold text-foreground">Favorites</h1>
          <p className="text-muted-foreground">Quick access to your most used items</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-5 h-5 mr-2" />
          Add Favorite
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : favorites.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No favorites yet. Add your first favorite!</p>
            <Button onClick={() => openModal()} className="mt-4">
              <Plus className="w-5 h-5 mr-2" />
              Add Favorite
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map((fav) => (
            <Card key={fav.id} className="group hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FavoriteIcon icon={fav.icon} />
                  <div className="flex-1 min-w-0">
                    {fav.url ? (
                      <a
                        href={fav.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground font-medium hover:text-primary flex items-center gap-2"
                      >
                        {fav.title}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : fav.targetType && fav.targetId ? (
                      <a
                        href={`/${fav.targetType.toLowerCase()}s/${fav.targetId}`}
                        className="text-foreground font-medium hover:text-primary"
                      >
                        {fav.title}
                      </a>
                    ) : (
                      <span className="text-foreground font-medium">{fav.title}</span>
                    )}
                    {fav.description && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{fav.description}</p>
                    )}
                    {fav.targetType && (
                      <span className="text-xs text-muted-foreground mt-2 inline-block">{fav.targetType}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openModal(fav)}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteFavorite(fav.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFavorite ? 'Edit Favorite' : 'Add Favorite'}</DialogTitle>
          </DialogHeader>
          <FavoriteForm
            favorite={editingFavorite || undefined}
            onSubmit={handleSubmit}
            onCancel={closeModal}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
