import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiGet, getErrorMessage } from '@/services/api';
import { RssFeed, Category } from '@/types';
import toast from 'react-hot-toast';

interface RssFeedFormData {
  title: string;
  description?: string;
  url: string;
  siteUrl?: string;
  refreshRate: number;
  isActive: boolean;
  showOnHome: boolean;
  categoryId?: string;
}

interface RssFeedFormProps {
  feed?: RssFeed;
  onSubmit: (data: RssFeedFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Values in seconds (backend expects 300-86400)
const REFRESH_RATES = [
  { value: 900, label: 'Every 15 minutes' },
  { value: 1800, label: 'Every 30 minutes' },
  { value: 3600, label: 'Every hour' },
  { value: 7200, label: 'Every 2 hours' },
  { value: 21600, label: 'Every 6 hours' },
  { value: 43200, label: 'Every 12 hours' },
  { value: 86400, label: 'Daily' },
];

export function RssFeedForm({ feed, onSubmit, onCancel, isLoading }: RssFeedFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<RssFeedFormData>({
    defaultValues: {
      title: feed?.title || '',
      description: feed?.description || '',
      url: feed?.url || '',
      siteUrl: feed?.siteUrl || '',
      refreshRate: feed?.refreshRate || 3600,
      isActive: feed?.isActive ?? true,
      showOnHome: feed?.showOnHome ?? false,
      categoryId: feed?.category?.id || '',
    },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const cats = await apiGet<Category[]>('/categories');
      setCategories(cats);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Feed Title *</label>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="input"
          placeholder="Feed name"
        />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="label">Feed URL *</label>
        <input
          type="url"
          {...register('url', {
            required: 'Feed URL is required',
            pattern: {
              value: /^https?:\/\/.+/i,
              message: 'Please enter a valid URL'
            }
          })}
          className="input"
          placeholder="https://example.com/feed.xml"
        />
        {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url.message}</p>}
      </div>

      <div>
        <label className="label">Site URL</label>
        <input
          type="url"
          {...register('siteUrl')}
          className="input"
          placeholder="https://example.com"
        />
        <p className="text-dark-500 text-xs mt-1">Optional: Link to the main website</p>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Refresh Rate</label>
          <select {...register('refreshRate', { valueAsNumber: true })} className="input">
            {REFRESH_RATES.map(rate => (
              <option key={rate.value} value={rate.value}>{rate.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Category</label>
          <select {...register('categoryId')} className="input">
            <option value="">No category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            {...register('isActive')}
            className="rounded border-dark-500"
          />
          <label htmlFor="isActive" className="text-dark-300">Active</label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showOnHome"
            {...register('showOnHome')}
            className="rounded border-dark-500"
          />
          <label htmlFor="showOnHome" className="text-dark-300">Show on Dashboard</label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : feed ? 'Update Feed' : 'Add Feed'}
        </button>
      </div>
    </form>
  );
}
