import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, getErrorMessage } from '@/services/api';
import { Procedure, PaginatedResponse } from '@/types';
import { PlusIcon, MagnifyingGlassIcon, BookOpenIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { ProcedureForm } from '@/components/forms/ProcedureForm';

export function ProceduresList() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProcedures();
  }, [search]);

  async function fetchProcedures() {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const response = await apiGet<PaginatedResponse<Procedure>>('/procedures', params);
      setProcedures(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  function openModal(procedure?: Procedure) {
    setEditingProcedure(procedure || null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProcedure(null);
  }

  async function handleSubmit(data: {
    title: string;
    content: string;
    isPinned: boolean;
    categoryId?: string;
    tagIds: string[];
  }) {
    setIsSaving(true);
    try {
      if (editingProcedure) {
        await apiPut(`/procedures/${editingProcedure.id}`, data);
        toast.success('Note updated successfully');
      } else {
        await apiPost('/procedures', data);
        toast.success('Note created successfully');
      }
      closeModal();
      fetchProcedures();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  // Strip HTML tags for preview
  function stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Notes</h1>
          <p className="text-dark-400">Rich text notes with categories and tags</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Note
        </button>
      </div>

      <div className="card">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : procedures.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpenIcon className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No notes found. Create your first note!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {procedures.map((proc) => (
            <div key={proc.id} className="card-hover cursor-pointer group" onClick={() => openModal(proc)}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpenIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-dark-100 group-hover:text-primary-400">{proc.title}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(proc); }}
                      className="p-1 hover:bg-dark-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <PencilIcon className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                  {proc.content && (
                    <p className="text-dark-400 text-sm mt-1 line-clamp-2">{stripHtml(proc.content)}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-dark-500">
                    {proc.category && (
                      <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: proc.category.color + '20', color: proc.category.color }}>
                        {proc.category.name}
                      </span>
                    )}
                    <span>{formatDistanceToNow(new Date(proc.updatedAt), { addSuffix: true })}</span>
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
        title={editingProcedure ? 'Edit Note' : 'New Note'}
        size="xl"
      >
        <ProcedureForm
          procedure={editingProcedure || undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
