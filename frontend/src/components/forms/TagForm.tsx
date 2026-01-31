import { useForm } from 'react-hook-form';
import { Tag } from '@/types';
import { cn } from '@/lib/utils';

interface TagFormData {
  name: string;
  color: string;
}

interface TagFormProps {
  tag?: Tag;
  onSubmit: (data: TagFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export function TagForm({ tag, onSubmit, onCancel, isLoading }: TagFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TagFormData>({
    defaultValues: {
      name: tag?.name || '',
      color: tag?.color || COLORS[0],
    },
  });

  const selectedColor = watch('color');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Name *</label>
        <input
          type="text"
          {...register('name', { required: 'Name is required' })}
          className="input"
          placeholder="Tag name"
        />
        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="label">Color *</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={cn(
                'w-8 h-8 rounded-lg transition-transform',
                selectedColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input type="hidden" {...register('color', { required: true })} />
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">Preview:</p>
        <span
          className="inline-block mt-2 px-3 py-1 rounded-full text-sm text-white"
          style={{ backgroundColor: selectedColor }}
        >
          {watch('name') || 'Tag name'}
        </span>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : tag ? 'Update Tag' : 'Create Tag'}
        </button>
      </div>
    </form>
  );
}
