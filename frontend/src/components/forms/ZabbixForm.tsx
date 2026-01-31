import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiGet, getErrorMessage } from '@/services/api';
import { ZabbixItem, Category, Tag } from '@/types';
import toast from 'react-hot-toast';

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
        apiGet<Category[]>('/categories?section=ZABBIX'),
        apiGet<Tag[]>('/tags?section=ZABBIX'),
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
      <div>
        <label className="label">Name *</label>
        <input
          type="text"
          {...register('name', { required: 'Name is required' })}
          className="input"
          placeholder="Item name"
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Item Type *</label>
          <select {...register('itemType')} className="input">
            {ITEM_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Version</label>
          <input
            type="text"
            {...register('version')}
            className="input"
            placeholder="e.g., 6.4"
          />
        </div>

        <div>
          <label className="label">Zabbix ID</label>
          <input
            type="text"
            {...register('zabbixId')}
            className="input"
            placeholder="External Zabbix ID"
          />
        </div>
      </div>

      <div>
        <label className="label">Content (JSON) *</label>
        <textarea
          {...register('content', { required: 'Content is required' })}
          className="input font-mono text-sm"
          rows={10}
          placeholder='{"key": "value"}'
        />
        {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>}
        <p className="text-dark-500 text-xs mt-1">Enter valid JSON configuration</p>
      </div>

      {tags.length > 0 && (
        <div>
          <label className="label">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
                style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
        </button>
      </div>
    </form>
  );
}
