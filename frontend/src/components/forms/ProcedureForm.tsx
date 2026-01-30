import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { apiGet, getErrorMessage } from '@/services/api';
import { Procedure, ProcedureStep, Category, Tag } from '@/types';
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ProcedureFormData {
  title: string;
  description?: string;
  version: string;
  isPinned: boolean;
  categoryId?: string;
  tagIds: string[];
  steps: {
    stepNumber: number;
    title: string;
    content: string;
    isOptional: boolean;
  }[];
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

  const { register, handleSubmit, control, formState: { errors } } = useForm<ProcedureFormData>({
    defaultValues: {
      title: procedure?.title || '',
      description: procedure?.description || '',
      version: procedure?.version || '1.0.0',
      isPinned: procedure?.isPinned || false,
      categoryId: procedure?.category?.id || '',
      tagIds: procedure?.tags?.map(t => t.id) || [],
      steps: procedure?.steps?.map((s, i) => ({
        stepNumber: i + 1,
        title: s.title,
        content: s.content,
        isOptional: s.isOptional,
      })) || [{ stepNumber: 1, title: '', content: '', isOptional: false }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'steps',
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

  function addStep() {
    append({ stepNumber: fields.length + 1, title: '', content: '', isOptional: false });
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < fields.length) {
      move(index, newIndex);
    }
  }

  function onFormSubmit(data: ProcedureFormData) {
    const stepsWithNumbers = data.steps.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
    }));
    onSubmit({ ...data, tagIds: selectedTags, steps: stepsWithNumbers });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="input"
          placeholder="Procedure title"
        />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          {...register('description')}
          className="input"
          rows={2}
          placeholder="Brief description of this procedure"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Version</label>
          <input
            type="text"
            {...register('version')}
            className="input"
            placeholder="1.0.0"
          />
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

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPinned"
          {...register('isPinned')}
          className="rounded border-dark-500"
        />
        <label htmlFor="isPinned" className="text-dark-300">Pin to top</label>
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

      <div className="border-t border-dark-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">Steps</label>
          <button
            type="button"
            onClick={addStep}
            className="btn-ghost text-sm"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Step
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="bg-dark-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-dark-300 font-medium">Step {index + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-dark-600 rounded disabled:opacity-50"
                  >
                    <ChevronUpIcon className="w-4 h-4 text-dark-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === fields.length - 1}
                    className="p-1 hover:bg-dark-600 rounded disabled:opacity-50"
                  >
                    <ChevronDownIcon className="w-4 h-4 text-dark-400" />
                  </button>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1 hover:bg-red-600/20 rounded text-red-400"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  {...register(`steps.${index}.title`, { required: 'Step title is required' })}
                  className="input"
                  placeholder="Step title"
                />
                <textarea
                  {...register(`steps.${index}.content`, { required: 'Step content is required' })}
                  className="input"
                  rows={3}
                  placeholder="Step instructions (Markdown supported)"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`step-${index}-optional`}
                    {...register(`steps.${index}.isOptional`)}
                    className="rounded border-dark-500"
                  />
                  <label htmlFor={`step-${index}-optional`} className="text-dark-400 text-sm">
                    Optional step
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : procedure ? 'Update Procedure' : 'Create Procedure'}
        </button>
      </div>
    </form>
  );
}
