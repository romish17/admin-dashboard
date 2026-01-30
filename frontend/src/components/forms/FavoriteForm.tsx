import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Favorite } from '@/types';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

interface FavoriteFormData {
  title: string;
  description?: string;
  url?: string;
  icon?: string;
}

interface FavoriteFormProps {
  favorite?: Favorite;
  onSubmit: (data: FavoriteFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ICONS = ['⭐', '📌', '🔖', '💡', '📁', '🔗', '📋', '🎯', '🚀', '💼', '📊', '🔧', '📝', '🎨', '🔒', '🌐'];

function getFaviconUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Use Google's favicon service as fallback
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch {
    return null;
  }
}

export function FavoriteForm({ favorite, onSubmit, onCancel, isLoading }: FavoriteFormProps) {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [useFavicon, setUseFavicon] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FavoriteFormData>({
    defaultValues: {
      title: favorite?.title || '',
      description: favorite?.description || '',
      url: favorite?.url || '',
      icon: favorite?.icon || '⭐',
    },
  });

  const selectedIcon = watch('icon');
  const urlValue = watch('url');

  // Auto-fetch favicon when URL changes
  useEffect(() => {
    if (urlValue && urlValue.startsWith('http')) {
      const favicon = getFaviconUrl(urlValue);
      setFaviconUrl(favicon);
    } else {
      setFaviconUrl(null);
      setUseFavicon(false);
    }
  }, [urlValue]);

  function selectFavicon() {
    if (faviconUrl) {
      setValue('icon', faviconUrl);
      setUseFavicon(true);
    }
  }

  function selectEmoji(icon: string) {
    setValue('icon', icon);
    setUseFavicon(false);
  }

  const isUsingFavicon = useFavicon || (selectedIcon && selectedIcon.startsWith('http'));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Titre *</label>
        <input
          type="text"
          {...register('title', { required: 'Le titre est requis' })}
          className="input"
          placeholder="Nom du favori"
        />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="label">URL</label>
        <input
          type="url"
          {...register('url')}
          className="input"
          placeholder="https://example.com (optionnel)"
        />
        <p className="text-dark-500 text-xs mt-1">Laissez vide pour les favoris internes</p>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          {...register('description')}
          className="input"
          rows={2}
          placeholder="Description optionnelle"
        />
      </div>

      <div>
        <label className="label">Icône</label>

        {/* Favicon option */}
        {faviconUrl && (
          <div className="mb-3 p-3 bg-dark-700/50 rounded-xl">
            <p className="text-dark-400 text-sm mb-2">Favicon du site :</p>
            <button
              type="button"
              onClick={selectFavicon}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isUsingFavicon
                  ? 'bg-primary-600 ring-2 ring-primary-400'
                  : 'bg-dark-700 hover:bg-dark-600'
              }`}
            >
              <img
                src={faviconUrl}
                alt="Favicon"
                className="w-6 h-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </button>
          </div>
        )}

        <p className="text-dark-400 text-sm mb-2">Ou choisissez un emoji :</p>
        <div className="flex flex-wrap gap-2">
          {ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => selectEmoji(icon)}
              className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                selectedIcon === icon && !isUsingFavicon
                  ? 'bg-primary-600 ring-2 ring-primary-400'
                  : 'bg-dark-700 hover:bg-dark-600'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('icon')} />
      </div>

      {/* Preview */}
      <div className="p-3 bg-dark-700/50 rounded-xl">
        <p className="text-dark-400 text-sm mb-2">Aperçu :</p>
        <div className="flex items-center gap-3">
          {isUsingFavicon && faviconUrl ? (
            <img src={faviconUrl} alt="" className="w-8 h-8" />
          ) : (
            <span className="text-2xl">{selectedIcon || '⭐'}</span>
          )}
          <span className="text-dark-100">{watch('title') || 'Titre du favori'}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Annuler
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Enregistrement...' : favorite ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}
