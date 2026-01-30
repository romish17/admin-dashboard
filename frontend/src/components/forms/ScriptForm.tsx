import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Script, Category, Tag } from '@/types';
import { apiGet } from '@/services/api';

interface ScriptFormData {
  title: string;
  description?: string;
  content: string;
  language: Script['language'];
  version: string;
  categoryId?: string;
  tagIds: string[];
}

interface ScriptFormProps {
  script?: Script;
  onSubmit: (data: ScriptFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const languages: { value: Script['language']; label: string }[] = [
  { value: 'BASH', label: 'Bash' },
  { value: 'POWERSHELL', label: 'PowerShell' },
  { value: 'PYTHON', label: 'Python' },
  { value: 'JAVASCRIPT', label: 'JavaScript' },
  { value: 'SQL', label: 'SQL' },
  { value: 'OTHER', label: 'Other' },
];

export function ScriptForm({ script, onSubmit, onCancel, isLoading }: ScriptFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(script?.tags.map(t => t.id) || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScriptFormData>({
    defaultValues: {
      title: script?.title || '',
      description: script?.description || '',
      content: script?.content || '',
      language: script?.language || 'BASH',
      version: script?.version || '1.0',
      categoryId: script?.category?.id || '',
    },
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  async function fetchOptions() {
    try {
      const [cats, tgs] = await Promise.all([
        apiGet<Category[]>('/categories'),
        apiGet<Tag[]>('/tags'),
      ]);
      setCategories(cats);
      setTags(tgs);
    } catch (error) {
      console.error('Failed to fetch options:', error);
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleFormSubmit(data: ScriptFormData) {
    await onSubmit({ ...data, tagIds: selectedTags });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1">Title *</label>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="input w-full"
          placeholder="Script title"
        />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1">Description</label>
        <textarea
          {...register('description')}
          className="input w-full"
          rows={2}
          placeholder="Brief description of the script"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Language *</label>
          <select {...register('language')} className="input w-full">
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Version</label>
          <input
            type="text"
            {...register('version')}
            className="input w-full"
            placeholder="1.0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1">Category</label>
        <select {...register('categoryId')} className="input w-full">
          <option value="">No category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1">Tags</label>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              {tag.name}
            </button>
          ))}
          {tags.length === 0 && <span className="text-dark-500 text-sm">No tags available</span>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1">Content *</label>
        <textarea
          {...register('content', { required: 'Content is required' })}
          className="input w-full font-mono text-sm"
          rows={12}
          placeholder="# Your script here..."
        />
        {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : script ? 'Update Script' : 'Create Script'}
        </button>
      </div>
    </form>
  );
}
