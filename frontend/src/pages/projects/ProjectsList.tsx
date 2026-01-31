import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, getErrorMessage } from '@/services/api';
import { Project } from '@/types';
import { Plus, Pencil, Trash2, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { ProjectForm } from '@/components/forms/ProjectForm';

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setIsLoading(true);
    try {
      const data = await apiGet<Project[]>('/todos/projects');
      setProjects(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  function openModal(project?: Project) {
    setEditingProject(project || null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProject(null);
  }

  async function handleSubmit(data: {
    name: string;
    description?: string;
    color: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  }) {
    setIsSaving(true);
    try {
      if (editingProject) {
        await apiPut(`/todos/projects/${editingProject.id}`, data);
        toast.success('Projet mis à jour');
      } else {
        await apiPost('/todos/projects', data);
        toast.success('Projet créé');
      }
      closeModal();
      fetchProjects();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    try {
      await apiDelete(`/todos/projects/${id}`);
      toast.success('Projet supprimé');
      fetchProjects();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const statusLabels = {
    ACTIVE: { label: 'Actif', class: 'bg-emerald-500/20 text-emerald-400' },
    ARCHIVED: { label: 'Archivé', class: 'bg-muted text-muted-foreground' },
    COMPLETED: { label: 'Terminé', class: 'bg-blue-500/20 text-blue-400' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projets</h1>
          <p className="text-muted-foreground">Gérez vos projets et organisez vos tâches</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Nouveau projet
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-12">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun projet. Créez votre premier projet !</p>
          <button onClick={() => openModal()} className="btn-primary mt-4">
            <Plus className="w-5 h-5 mr-2" />
            Nouveau projet
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="card-hover group"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${project.color}20` }}
                >
                  <Folder className="w-6 h-6" style={{ color: project.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{project.name}</h3>
                      {project.description && (
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openModal(project)}
                        className="p-1.5 hover:bg-muted rounded-lg"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={cn('badge', statusLabels[project.status].class)}>
                      {statusLabels[project.status].label}
                    </span>
                    {project.stats && (
                      <span className="text-xs text-muted-foreground">
                        {project.stats.total || 0} tâches
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProject ? 'Modifier le projet' : 'Nouveau projet'}
        size="sm"
      >
        <ProjectForm
          project={editingProject || undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
