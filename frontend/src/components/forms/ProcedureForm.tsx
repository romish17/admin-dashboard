import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { apiGet, getErrorMessage } from '@/services/api';
import { Procedure, Category, Tag } from '@/types';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          {...register('title', { required: 'Title is required' })}
          placeholder="Procedure title"
        />
        {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          {...register('description')}
          rows={2}
          placeholder="Brief description of this procedure"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Version</Label>
          <Input {...register('version')} placeholder="1.0.0" />
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

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPinned"
          {...register('isPinned')}
          className="rounded border-border"
        />
        <Label htmlFor="isPinned" className="font-normal">Pin to top</Label>
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

      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="mb-0">Steps</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addStep}>
            <Plus className="w-4 h-4 mr-1" />
            Add Step
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground font-medium">Step {index + 1}</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === fields.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  {...register(`steps.${index}.title`, { required: 'Step title is required' })}
                  placeholder="Step title"
                />
                <Textarea
                  {...register(`steps.${index}.content`, { required: 'Step content is required' })}
                  rows={3}
                  placeholder="Step instructions (Markdown supported)"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`step-${index}-optional`}
                    {...register(`steps.${index}.isOptional`)}
                    className="rounded border-border"
                  />
                  <Label htmlFor={`step-${index}-optional`} className="font-normal text-muted-foreground text-sm">
                    Optional step
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : procedure ? 'Update Procedure' : 'Create Procedure'}
        </Button>
      </div>
    </form>
  );
}
