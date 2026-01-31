import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, getErrorMessage } from '@/services/api';
import { Todo, Project, PaginatedResponse } from '@/types';
import { Plus, Check, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { TodoForm } from '@/components/forms/TodoForm';

const statusColors = {
  TODO: 'bg-dark-600',
  IN_PROGRESS: 'bg-blue-500',
  DONE: 'bg-green-500',
  CANCELLED: 'bg-gray-500',
};

const priorityColors = {
  URGENT: 'border-l-red-500',
  HIGH: 'border-l-orange-500',
  MEDIUM: 'border-l-yellow-500',
  LOW: 'border-l-green-500',
};

export function TodosList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedProject]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { showCompleted: 'false' };
      if (selectedProject) params.projectId = selectedProject;

      const [todosRes, projectsRes] = await Promise.all([
        apiGet<PaginatedResponse<Todo>>('/todos', params),
        apiGet<Project[]>('/todos/projects').catch(() => []),
      ]);
      setTodos(todosRes.data);
      setProjects(projectsRes);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleTodo(id: string) {
    try {
      const result = await apiPost<Todo>(`/todos/${id}/toggle`);
      setTodos(todos.map(t => t.id === id ? result : t));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function openModal(todo?: Todo) {
    setEditingTodo(todo || null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTodo(null);
  }

  async function handleSubmit(data: {
    title: string;
    description?: string;
    status: Todo['status'];
    priority: Todo['priority'];
    dueDate?: string;
    projectId?: string;
    categoryId?: string;
    tagIds: string[];
  }) {
    setIsSaving(true);
    try {
      if (editingTodo) {
        await apiPut(`/todos/${editingTodo.id}`, data);
        toast.success('Task updated successfully');
      } else {
        await apiPost('/todos', data);
        toast.success('Task created successfully');
      }
      closeModal();
      fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Todos</h1>
          <p className="text-muted-foreground">Manage your tasks and projects</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          New Task
        </button>
      </div>

      {/* Projects filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedProject('')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
            !selectedProject ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-dark-600'
          )}
        >
          All Tasks
        </button>
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              selectedProject === project.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-dark-600'
            )}
            style={selectedProject === project.id ? {} : { borderLeft: `3px solid ${project.color}` }}
          >
            {project.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : todos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted-foreground">No tasks found. Create your first task!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={cn(
                'card-hover flex items-center gap-4 border-l-4',
                priorityColors[todo.priority]
              )}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                  todo.status === 'DONE'
                    ? 'bg-green-500 border-green-500'
                    : 'border-muted-foreground hover:border-primary-500'
                )}
              >
                {todo.status === 'DONE' && <Check className="w-4 h-4 text-white" />}
              </button>

              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openModal(todo)}>
                <h3 className={cn(
                  'font-medium',
                  todo.status === 'DONE' ? 'text-muted-foreground line-through' : 'text-foreground'
                )}>
                  {todo.title}
                </h3>
                {todo.description && (
                  <p className="text-muted-foreground text-sm truncate">{todo.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {todo.project && (
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: `${todo.project.color}20`, color: todo.project.color }}
                  >
                    {todo.project.name}
                  </span>
                )}
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  statusColors[todo.status]
                )} />
                <button
                  onClick={() => openModal(todo)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTodo ? 'Edit Task' : 'New Task'}
        size="lg"
      >
        <TodoForm
          todo={editingTodo || undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
