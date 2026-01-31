import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiGet, getErrorMessage } from '@/services/api';
import { RegistryEntry, Category, Tag } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface RegistryFormData {
  name: string;
  description?: string;
  keyPath: string;
  valueName: string;
  valueData: string;
  valueType: RegistryEntry['valueType'];
  isEnabled: boolean;
  categoryId?: string;
  tagIds: string[];
}

interface RegistryFormProps {
  entry?: RegistryEntry;
  onSubmit: (data: RegistryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const VALUE_TYPES: { value: RegistryEntry['valueType']; label: string }[] = [
  { value: 'REG_SZ', label: 'REG_SZ (String)' },
  { value: 'REG_EXPAND_SZ', label: 'REG_EXPAND_SZ (Expandable String)' },
  { value: 'REG_MULTI_SZ', label: 'REG_MULTI_SZ (Multi-String)' },
  { value: 'REG_DWORD', label: 'REG_DWORD (32-bit)' },
  { value: 'REG_QWORD', label: 'REG_QWORD (64-bit)' },
  { value: 'REG_BINARY', label: 'REG_BINARY (Binary)' },
  { value: 'REG_NONE', label: 'REG_NONE (No type)' },
];

export function RegistryForm({ entry, onSubmit, onCancel, isLoading }: RegistryFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(entry?.tags?.map(t => t.id) || []);

  const { register, handleSubmit, formState: { errors } } = useForm<RegistryFormData>({
    defaultValues: {
      name: entry?.name || '',
      description: entry?.description || '',
      keyPath: entry?.keyPath || 'HKEY_LOCAL_MACHINE\\SOFTWARE\\',
      valueName: entry?.valueName || '',
      valueData: entry?.valueData || '',
      valueType: entry?.valueType || 'REG_SZ',
      isEnabled: entry?.isEnabled ?? true,
      categoryId: entry?.category?.id || '',
      tagIds: entry?.tags?.map(t => t.id) || [],
    },
  });

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  async function fetchCategoriesAndTags() {
    try {
      const [cats, tgs] = await Promise.all([
        apiGet<Category[]>('/categories'),
        apiGet<Tag[]>('/tags'),
      ]);
      setCategories(cats);
      setTags(tgs);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }

  function onFormSubmit(data: RegistryFormData) {
    onSubmit({ ...data, tagIds: selectedTags });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input
          {...register('name', { required: 'Name is required' })}
          placeholder="Entry name"
        />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          {...register('description')}
          rows={2}
          placeholder="Optional description"
        />
      </div>

      <div className="space-y-2">
        <Label>Key Path *</Label>
        <Input
          {...register('keyPath', { required: 'Key path is required' })}
          className="font-mono text-sm"
          placeholder="HKEY_LOCAL_MACHINE\SOFTWARE\..."
        />
        {errors.keyPath && <p className="text-destructive text-sm">{errors.keyPath.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Value Name *</Label>
          <Input
            {...register('valueName', { required: 'Value name is required' })}
            className="font-mono text-sm"
            placeholder="(Default) or value name"
          />
          {errors.valueName && <p className="text-destructive text-sm">{errors.valueName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Value Type *</Label>
          <select {...register('valueType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {VALUE_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Value Data *</Label>
        <Textarea
          {...register('valueData', { required: 'Value data is required' })}
          className="font-mono text-sm"
          rows={3}
          placeholder="Value data"
        />
        {errors.valueData && <p className="text-destructive text-sm">{errors.valueData.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <select {...register('categoryId')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">No category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pt-7">
          <input
            type="checkbox"
            id="isEnabled"
            {...register('isEnabled')}
            className="rounded border-border"
          />
          <Label htmlFor="isEnabled" className="font-normal">Enabled</Label>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm transition-colors',
                  selectedTags.includes(tag.id)
                    ? 'text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : entry ? 'Update Entry' : 'Create Entry'}
        </Button>
      </div>
    </form>
  );
}
