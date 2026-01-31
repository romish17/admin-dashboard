import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Note, Category, Tag } from '@/types';
import { apiGet } from '@/services/api';

interface NoteFormData {
  title: string;
  content: string;
  isMarkdown: boolean;
  isPinned: boolean;
  categoryId?: string;
  tagIds: string[];
}

interface NoteFormProps {
  note?: Note;
  onSubmit: (data: NoteFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function NoteForm({ note, onSubmit, onCancel, isLoading }: NoteFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(note?.tags.map(t => t.id) || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NoteFormData>({
    defaultValues: {
      title: note?.title || '',
      content: note?.content || '',
      isMarkdown: note?.isMarkdown ?? true,
      isPinned: note?.isPinned ?? false,
      categoryId: note?.category?.id || '',
    },
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  async function fetchOptions() {
    try {
      const [cats, tgs] = await Promise.all([
        apiGet<Category[]>('/categories?section=NOTES'),
        apiGet<Tag[]>('/tags?section=NOTES'),
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

  async function handleFormSubmit(data: NoteFormData) {
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
          placeholder="Note title"
        />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1">Category</label>
        <select {...register('categoryId')} className="input w-full">
          <option value="">No category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
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

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('isMarkdown')} className="w-4 h-4 rounded" />
          <span className="text-sm text-dark-300">Markdown</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('isPinned')} className="w-4 h-4 rounded" />
          <span className="text-sm text-dark-300">Pinned</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1">Content *</label>
        <textarea
          {...register('content', { required: 'Content is required' })}
          className="input w-full font-mono text-sm"
          rows={12}
          placeholder="Write your note here..."
        />
        {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : note ? 'Update Note' : 'Create Note'}
        </button>
      </div>
    </form>
  );
}
