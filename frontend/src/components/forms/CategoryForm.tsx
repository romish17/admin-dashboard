import { useForm } from 'react-hook-form';
import { Category } from '@/types';
import clsx from 'clsx';

interface CategoryFormData {
  name: string;
  description?: string;
  color: string;
  icon?: string;
}

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

const ICONS = [
  'folder', 'document', 'code', 'server',
  'database', 'cloud', 'cog', 'terminal',
  'shield', 'lock', 'key', 'globe',
  'chart', 'calendar', 'bookmark', 'star',
];

export function CategoryForm({ category, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CategoryFormData>({
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      color: category?.color || COLORS[0],
      icon: category?.icon || '',
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Name *</label>
        <input
          type="text"
          {...register('name', { required: 'Name is required' })}
          className="input"
          placeholder="Category name"
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
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
        <label className="label">Color *</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={clsx(
                'w-8 h-8 rounded-lg transition-transform',
                selectedColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-dark-900 scale-110'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input type="hidden" {...register('color', { required: true })} />
      </div>

      <div>
        <label className="label">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setValue('icon', icon)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                selectedIcon === icon
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
}
