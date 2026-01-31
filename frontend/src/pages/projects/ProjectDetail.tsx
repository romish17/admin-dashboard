import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPut, apiPost, getErrorMessage } from '@/services/api';
import { Project, Todo, PaginatedResponse } from '@/types';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { KanbanBoard, KanbanColumn, KanbanItem } from '@/components/ui/KanbanBoard';
import { Modal } from '@/components/ui/Modal';
import { TodoForm } from '@/components/forms/TodoForm';
import toast from 'react-hot-toast';

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'TODO', title: 'À faire', color: '#6b7280' },
  { id: 'IN_PROGRESS', title: 'En cours', color: '#3b82f6' },
  { id: 'DONE', title: 'Terminé', color: '#22c55e' },
  { id: 'CANCELLED', title: 'Annulé', color: '#ef4444' },
];

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<string>('TODO');

  useEffect(() => {
    if (id) {
      fetchProjectAndTodos();
    }
  }, [id]);

  async function fetchProjectAndTodos() {
    setIsLoading(true);
    try {
      const [projectData, todosResponse] = await Promise.all([
        apiGet<Project>(`/todos/projects/${id}`),
        apiGet<PaginatedResponse<Todo>>(`/todos?projectId=${id}&limit=100`),
      ]);
      setProject(projectData);
      setTodos(todosResponse.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  }

  function openModal(todo?: Todo, status?: string) {
    setEditingTodo(todo || null);
    setDefaultStatus(status || 'TODO');
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
      // Always use this project's ID
      const submitData = { ...data, projectId: id };

      if (editingTodo) {
        await apiPut(`/todos/${editingTodo.id}`, submitData);
        toast.success('Tâche mise à jour');
      } else {
        await apiPost('/todos', submitData);
        toast.success('Tâche créée');
      }
      closeModal();
      fetchProjectAndTodos();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleItemMove(itemId: string, newStatus: string, _newIndex: number) {
    try {
      await apiPut(`/todos/${itemId}`, { status: newStatus });
      // Update local state immediately for smooth UX
      setTodos(prev => prev.map(todo =>
        todo.id === itemId ? { ...todo, status: newStatus as Todo['status'] } : todo
      ));
    } catch (error) {
      toast.error(getErrorMessage(error));
      // Refresh to get correct state
      fetchProjectAndTodos();
    }
  }

  function handleItemClick(item: KanbanItem) {
    const todo = todos.find(t => t.id === item.id);
    if (todo) {
      openModal(todo);
    }
  }

  function handleAddItem(status: string) {
    openModal(undefined, status);
  }

  // Convert todos to KanbanItems
  const kanbanItems: KanbanItem[] = todos.map(todo => ({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    status: todo.status,
    priority: todo.priority,
    dueDate: todo.dueDate,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-dark-800 rounded-xl transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-dark-400" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${project.color}20` }}
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: project.color }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">{project.name}</h1>
            {project.description && (
              <p className="text-dark-400 text-sm">{project.description}</p>
            )}
          </div>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nouvelle tâche
        </button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-4 px-4 lg:-mx-8 lg:px-8">
        <KanbanBoard
          columns={KANBAN_COLUMNS}
          items={kanbanItems}
          onItemMove={handleItemMove}
          onItemClick={handleItemClick}
          onAddItem={handleAddItem}
        />
      </div>

      {/* Modal for creating/editing tasks */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTodo ? 'Modifier la tâche' : 'Nouvelle tâche'}
        size="lg"
      >
        <TodoForm
          todo={editingTodo ? { ...editingTodo, status: editingTodo.status } : { status: defaultStatus as Todo['status'] } as Todo}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
