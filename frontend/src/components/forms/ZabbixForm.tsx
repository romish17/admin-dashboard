import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiGet, getErrorMessage } from '@/services/api';
import { ZabbixItem, Category, Tag } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ZabbixFormData {
  name: string;
  description?: string;
  itemType: ZabbixItem['itemType'];
  content: string;
  version?: string;
  zabbixId?: string;
  categoryId?: string;
  tagIds: string[];
}

interface ZabbixFormProps {
  item?: ZabbixItem;
  onSubmit: (data: ZabbixFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ITEM_TYPES: { value: ZabbixItem['itemType']; label: string }[] = [
  { value: 'ITEM', label: 'Item' },
  { value: 'TRIGGER', label: 'Trigger' },
  { value: 'TEMPLATE', label: 'Template' },
  { value: 'HOST', label: 'Host' },
  { value: 'HOSTGROUP', label: 'Host Group' },
  { value: 'ACTION', label: 'Action' },
  { value: 'MACRO', label: 'Macro' },
  { value: 'OTHER', label: 'Other' },
];

export function ZabbixForm({ item, onSubmit, onCancel, isLoading }: ZabbixFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(item?.tags?.map(t => t.id) || []);

  const { register, handleSubmit, formState: { errors } } = useForm<ZabbixFormData>({
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      itemType: item?.itemType || 'ITEM',
      content: item?.content ? JSON.stringify(item.content, null, 2) : '{\n  \n}',
      version: item?.version || '',
      zabbixId: item?.zabbixId || '',
      categoryId: item?.category?.id || '',
      tagIds: item?.tags?.map(t => t.id) || [],
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

  function onFormSubmit(data: ZabbixFormData) {
    // Validate JSON content
    try {
      JSON.parse(data.content);
    } catch {
      toast.error('Invalid JSON content');
      return;
    }
    onSubmit({ ...data, tagIds: selectedTags });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input
          {...register('name', { required: 'Name is required' })}
          placeholder="Item name"
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Item Type *</Label>
          <select {...register('itemType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {ITEM_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Version</Label>
          <Input {...register('version')} placeholder="e.g., 6.4" />
        </div>

        <div className="space-y-2">
          <Label>Zabbix ID</Label>
          <Input {...register('zabbixId')} placeholder="External Zabbix ID" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Content (JSON) *</Label>
        <Textarea
          {...register('content', { required: 'Content is required' })}
          className="font-mono text-sm"
          rows={10}
          placeholder='{"key": "value"}'
        />
        {errors.content && <p className="text-destructive text-sm">{errors.content.message}</p>}
        <p className="text-muted-foreground text-xs">Enter valid JSON configuration</p>
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
          {isLoading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
        </Button>
      </div>
    </form>
  );
}
