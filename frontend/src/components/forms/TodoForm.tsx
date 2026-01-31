import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Todo, Category, Tag, Project } from '@/types';
import { apiGet } from '@/services/api';

interface TodoFormData {
  title: string;
  description?: string;
  status: Todo['status'];
  priority: Todo['priority'];
  dueDate?: string;
  projectId?: string;
  categoryId?: string;
  tagIds: string[];
}

interface TodoFormProps {
  todo?: Todo;
  onSubmit: (data: TodoFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const priorities: { value: Todo['priority']; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-500' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-500' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-500' },
];

const statuses: { value: Todo['status']; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function TodoForm({ todo, onSubmit, onCancel, isLoading }: TodoFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(todo?.tags.map(t => t.id) || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TodoFormData>({
    defaultValues: {
      title: todo?.title || '',
      description: todo?.description || '',
      status: todo?.status || 'TODO',
      priority: todo?.priority || 'MEDIUM',
      dueDate: todo?.dueDate ? todo.dueDate.split('T')[0] : '',
      projectId: todo?.project?.id || '',
      categoryId: todo?.category?.id || '',
    },
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  async function fetchOptions() {
    try {
      const [cats, tgs, projs] = await Promise.all([
        apiGet<Category[]>('/categories?section=TODOS').catch(() => []),
        apiGet<Tag[]>('/tags?section=TODOS').catch(() => []),
        apiGet<Project[]>('/todos/projects').catch(() => []),
      ]);
      setCategories(cats);
      setTags(tgs);
      setProjects(projs);
    } catch (error) {
      console.error('Failed to fetch options:', error);
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleFormSubmit(data: TodoFormData) {
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
          placeholder="Task title"
        />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1">Description</label>
        <textarea
          {...register('description')}
          className="input w-full"
          rows={3}
          placeholder="Task description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Status</label>
          <select {...register('status')} className="input w-full">
            {statuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Priority</label>
          <select {...register('priority')} className="input w-full">
            {priorities.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Due Date</label>
          <input type="date" {...register('dueDate')} className="input w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Project</label>
          <select {...register('projectId')} className="input w-full">
            <option value="">No project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
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

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : todo ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
