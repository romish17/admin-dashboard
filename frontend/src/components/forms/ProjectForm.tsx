import { useForm } from 'react-hook-form';
import { Project } from '@/types';

interface ProjectFormData {
  name: string;
  description?: string;
  color: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
}

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'ARCHIVED', label: 'Archivé' },
  { value: 'COMPLETED', label: 'Terminé' },
];

export function ProjectForm({ project, onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProjectFormData>({
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      color: project?.color || COLORS[0],
      status: project?.status || 'ACTIVE',
    },
  });

  const selectedColor = watch('color');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Nom du projet *</label>
        <input
          type="text"
          {...register('name', { required: 'Le nom est requis' })}
          className="input"
          placeholder="Mon projet"
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          {...register('description')}
          className="input"
          rows={3}
          placeholder="Description du projet (optionnel)"
        />
      </div>

      <div>
        <label className="label">Statut</label>
        <select {...register('status')} className="input">
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Couleur</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`w-8 h-8 rounded-lg transition-transform ${
                selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input type="hidden" {...register('color', { required: true })} />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Annuler
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Enregistrement...' : project ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
}
