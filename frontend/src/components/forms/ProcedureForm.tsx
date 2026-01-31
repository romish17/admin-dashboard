import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiGet, getErrorMessage } from '@/services/api';
import { Procedure, Category, Tag } from '@/types';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import toast from 'react-hot-toast';

interface ProcedureFormData {
  title: string;
  content: string;
  isPinned: boolean;
  categoryId?: string;
  tagIds: string[];
}

interface ProcedureFormProps {
  procedure?: Procedure;
  onSubmit: (data: ProcedureFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProcedureForm({ procedure, onSubmit, onCancel, isLoading }: ProcedureFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(procedure?.tags?.map(t => t.id) || []);
  const [content, setContent] = useState(procedure?.content || '');

  const { register, handleSubmit, formState: { errors } } = useForm<ProcedureFormData>({
    defaultValues: {
      title: procedure?.title || '',
      content: procedure?.content || '',
      isPinned: procedure?.isPinned || false,
      categoryId: procedure?.category?.id || '',
      tagIds: procedure?.tags?.map(t => t.id) || [],
    },
  });

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  async function fetchCategoriesAndTags() {
    try {
      const [cats, tgs] = await Promise.all([
        apiGet<Category[]>('/categories?section=PROCEDURES'),
        apiGet<Tag[]>('/tags?section=PROCEDURES'),
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

  function onFormSubmit(data: ProcedureFormData) {
    if (!content.trim() || content === '<p></p>') {
      toast.error('Content is required');
      return;
    }
    onSubmit({ ...data, content, tagIds: selectedTags });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="input"
          placeholder="Note title"
        />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
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
            id="isPinned"
            {...register('isPinned')}
            className="rounded border-dark-500"
          />
          <label htmlFor="isPinned" className="text-dark-300">Pin to top</label>
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

      <div>
        <label className="label">Content *</label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Start writing your note..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : procedure ? 'Update Note' : 'Create Note'}
        </button>
      </div>
    </form>
  );
}
