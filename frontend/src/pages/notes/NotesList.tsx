import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, getErrorMessage } from '@/services/api';
import { Note, PaginatedResponse } from '@/types';
import { PlusIcon, MagnifyingGlassIcon, StarIcon, PencilIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { NoteForm } from '@/components/forms/NoteForm';

export function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [search]);

  async function fetchNotes() {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const response = await apiGet<PaginatedResponse<Note>>('/notes', params);
      setNotes(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleFavorite(id: string) {
    try {
      await apiPost(`/notes/${id}/favorite`);
      setNotes(notes.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function openModal(note?: Note) {
    setEditingNote(note || null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingNote(null);
  }

  async function handleSubmit(data: {
    title: string;
    content: string;
    isMarkdown: boolean;
    isPinned: boolean;
    categoryId?: string;
    tagIds: string[];
  }) {
    setIsSaving(true);
    try {
      if (editingNote) {
        await apiPut(`/notes/${editingNote.id}`, data);
        toast.success('Note updated successfully');
      } else {
        await apiPost('/notes', data);
        toast.success('Note created successfully');
      }
      closeModal();
      fetchNotes();
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
          <h1 className="text-2xl font-bold text-dark-100">Notes</h1>
          <p className="text-dark-400">Quick notes and documentation</p>
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
      ) : notes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-dark-400">No notes found. Create your first note!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div key={note.id} className="card-hover group cursor-pointer" onClick={() => openModal(note)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-lg font-medium text-dark-100 group-hover:text-primary-400 truncate">
                  {note.title}
                </h3>
                <div className="flex items-center gap-1">
                  {note.isPinned && <span className="text-primary-400">📌</span>}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(note.id); }}
                    className="p-1 hover:bg-dark-700 rounded"
                  >
                    {note.isFavorite ? (
                      <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-4 h-4 text-dark-500" />
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openModal(note); }}
                    className="p-1 hover:bg-dark-700 rounded"
                  >
                    <PencilIcon className="w-4 h-4 text-dark-400" />
                  </button>
                </div>
              </div>
              <div className="text-dark-400 text-sm line-clamp-3 prose-dark">
                {note.isMarkdown ? (
                  <ReactMarkdown>{note.content.substring(0, 200)}</ReactMarkdown>
                ) : (
                  note.content.substring(0, 200)
                )}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-dark-500">
                {note.category && <span style={{ color: note.category.color }}>{note.category.name}</span>}
                <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingNote ? 'Edit Note' : 'New Note'}
        size="lg"
      >
        <NoteForm
          note={editingNote || undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
