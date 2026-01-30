import { useForm } from 'react-hook-form';
import { Favorite } from '@/types';

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

export function FavoriteForm({ favorite, onSubmit, onCancel, isLoading }: FavoriteFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FavoriteFormData>({
    defaultValues: {
      title: favorite?.title || '',
      description: favorite?.description || '',
      url: favorite?.url || '',
      icon: favorite?.icon || '⭐',
    },
  });

  const selectedIcon = watch('icon');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="input"
          placeholder="Favorite name"
        />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="label">URL</label>
        <input
          type="url"
          {...register('url')}
          className="input"
          placeholder="https://example.com (optional)"
        />
        <p className="text-dark-500 text-xs mt-1">Leave empty for internal favorites</p>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          {...register('description')}
          className="input"
          rows={2}
          placeholder="Optional description"
        />
      </div>

      <div>
        <label className="label">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setValue('icon', icon)}
              className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                selectedIcon === icon
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

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : favorite ? 'Update Favorite' : 'Add Favorite'}
        </button>
      </div>
    </form>
  );
}
