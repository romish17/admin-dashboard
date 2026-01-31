import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiGet, getErrorMessage } from '@/services/api';
import { RegistryEntry, Category, Tag } from '@/types';
import toast from 'react-hot-toast';

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
        apiGet<Category[]>('/categories?section=REGISTRIES'),
        apiGet<Tag[]>('/tags?section=REGISTRIES'),
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
      <div>
        <label className="label">Name *</label>
        <input
          type="text"
          {...register('name', { required: 'Name is required' })}
          className="input"
          placeholder="Entry name"
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
        <label className="label">Key Path *</label>
        <input
          type="text"
          {...register('keyPath', { required: 'Key path is required' })}
          className="input font-mono text-sm"
          placeholder="HKEY_LOCAL_MACHINE\SOFTWARE\..."
        />
        {errors.keyPath && <p className="text-red-400 text-sm mt-1">{errors.keyPath.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Value Name *</label>
          <input
            type="text"
            {...register('valueName', { required: 'Value name is required' })}
            className="input font-mono text-sm"
            placeholder="(Default) or value name"
          />
          {errors.valueName && <p className="text-red-400 text-sm mt-1">{errors.valueName.message}</p>}
        </div>

        <div>
          <label className="label">Value Type *</label>
          <select {...register('valueType')} className="input">
            {VALUE_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Value Data *</label>
        <textarea
          {...register('valueData', { required: 'Value data is required' })}
          className="input font-mono text-sm"
          rows={3}
          placeholder="Value data"
        />
        {errors.valueData && <p className="text-red-400 text-sm mt-1">{errors.valueData.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <select {...register('categoryId')} className="input">
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
            className="rounded border-dark-500"
          />
          <label htmlFor="isEnabled" className="text-dark-300">Enabled</label>
        </div>
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
          {isLoading ? 'Saving...' : entry ? 'Update Entry' : 'Create Entry'}
        </button>
      </div>
    </form>
  );
}
