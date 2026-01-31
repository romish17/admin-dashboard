import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiGet, apiPost, apiPut, getErrorMessage } from '@/services/api';
import { Procedure, Category, Tag } from '@/types';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ProcedureFormData {
  title: string;
  content: string;
  isPinned: boolean;
  categoryId?: string;
  tagIds: string[];
}

export function ProcedureEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProcedureFormData>({
    defaultValues: {
      title: '',
      content: '',
      isPinned: false,
      categoryId: '',
    },
  });

  useEffect(() => {
    fetchCategoriesAndTags();
    if (!isNew) {
      fetchProcedure();
    }
  }, [id]);

  async function fetchProcedure() {
    try {
      const data = await apiGet<Procedure>(`/procedures/${id}`);
      setProcedure(data);
      setContent(data.content || '');
      setSelectedTags(data.tags?.map(t => t.id) || []);
      reset({
        title: data.title,
        content: data.content,
        isPinned: data.isPinned,
        categoryId: data.category?.id || '',
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/procedures');
    } finally {
      setIsLoading(false);
    }
  }

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

  async function onSubmit(data: ProcedureFormData) {
    if (!content.trim() || content === '<p></p>') {
      toast.error('Content is required');
      return;
    }

    setIsSaving(true);
    try {
      const submitData = {
        ...data,
        content,
        tagIds: selectedTags,
        categoryId: data.categoryId || undefined,
      };

      if (isNew) {
        await apiPost('/procedures', submitData);
        toast.success('Note created successfully');
      } else {
        await apiPut(`/procedures/${id}`, submitData);
        toast.success('Note updated successfully');
      }
      navigate('/procedures');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/procedures')}
          className="p-2 hover:bg-dark-800 rounded-xl transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-dark-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark-100">
            {isNew ? 'New Note' : 'Edit Note'}
          </h1>
          <p className="text-dark-400">
            {isNew ? 'Create a new note with rich text content' : `Editing: ${procedure?.title}`}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card space-y-6">
          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="input text-lg"
              placeholder="Note title"
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* Category and Pin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="rounded border-dark-500 w-4 h-4"
              />
              <label htmlFor="isPinned" className="text-dark-300">Pin to top</label>
            </div>
          </div>

          {/* Tags */}
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
                        ? 'text-white'
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
        </div>

        {/* Content Editor */}
        <div className="card">
          <label className="label mb-4">Content *</label>
          <div className="min-h-[400px]">
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your note..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/procedures')}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="btn-primary">
            {isSaving ? 'Saving...' : isNew ? 'Create Note' : 'Update Note'}
          </button>
        </div>
      </form>
    </div>
  );
}
