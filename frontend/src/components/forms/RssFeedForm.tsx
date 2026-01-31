import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiGet, getErrorMessage } from '@/services/api';
import { RssFeed, Category } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
      <div className="space-y-2">
        <Label>Feed Title *</Label>
        <Input
          {...register('title', { required: 'Title is required' })}
          placeholder="Feed name"
        />
        {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Feed URL *</Label>
        <Input
          type="url"
          {...register('url', {
            required: 'Feed URL is required',
            pattern: {
              value: /^https?:\/\/.+/i,
              message: 'Please enter a valid URL'
            }
          })}
          placeholder="https://example.com/feed.xml"
        />
        {errors.url && <p className="text-destructive text-sm">{errors.url.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Site URL</Label>
        <Input
          type="url"
          {...register('siteUrl')}
          placeholder="https://example.com"
        />
        <p className="text-muted-foreground text-xs">Optional: Link to the main website</p>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          {...register('description')}
          rows={2}
          placeholder="Optional description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Refresh Rate</Label>
          <select {...register('refreshRate', { valueAsNumber: true })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {REFRESH_RATES.map(rate => (
              <option key={rate.value} value={rate.value}>{rate.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <select {...register('categoryId')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
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
            className="rounded border-border"
          />
          <Label htmlFor="isActive" className="font-normal">Active</Label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showOnHome"
            {...register('showOnHome')}
            className="rounded border-border"
          />
          <Label htmlFor="showOnHome" className="font-normal">Show on Dashboard</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : feed ? 'Update Feed' : 'Add Feed'}
        </Button>
      </div>
    </form>
  );
}
