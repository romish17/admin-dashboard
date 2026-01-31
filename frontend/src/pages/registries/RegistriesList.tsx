import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, getErrorMessage } from '@/services/api';
import { RegistryEntry, PaginatedResponse } from '@/types';
import { Plus, Search, Download, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { RegistryForm } from '@/components/forms/RegistryForm';

export function RegistriesList() {
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RegistryEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [search]);

  async function fetchEntries() {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const response = await apiGet<PaginatedResponse<RegistryEntry>>('/registries', params);
      setEntries(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function exportSelected() {
    if (selected.size === 0) {
      toast.error('Select at least one entry to export');
      return;
    }
    try {
      const response = await fetch('/api/v1/registries/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registry_export.reg';
      a.click();
      toast.success('Registry file exported');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function openModal(entry?: RegistryEntry) {
    setEditingEntry(entry || null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingEntry(null);
  }

  async function handleSubmit(data: {
    name: string;
    description?: string;
    keyPath: string;
    valueName: string;
    valueData: string;
    valueType: RegistryEntry['valueType'];
    isEnabled: boolean;
    categoryId?: string;
    tagIds: string[];
  }) {
    setIsSaving(true);
    try {
      if (editingEntry) {
        await apiPut(`/registries/${editingEntry.id}`, data);
        toast.success('Registry entry updated successfully');
      } else {
        await apiPost('/registries', data);
        toast.success('Registry entry created successfully');
      }
      closeModal();
      fetchEntries();
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
          <h1 className="text-2xl font-bold text-foreground">Windows Registry</h1>
          <p className="text-muted-foreground">Manage registry entries and export as .reg files</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={exportSelected} className="btn-secondary">
              <Download className="w-5 h-5 mr-2" />
              Export ({selected.size})
            </button>
          )}
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            New Entry
          </button>
        </div>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search registry entries..."
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
      ) : entries.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted-foreground">No registry entries found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === entries.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected(new Set(entries.map(e => e.id)));
                      } else {
                        setSelected(new Set());
                      }
                    }}
                    className="rounded border-muted-foreground"
                  />
                </th>
                <th className="p-3 text-left text-muted-foreground font-medium">Name</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Key Path</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Type</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Value</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border hover:bg-muted/50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(entry.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selected);
                        if (e.target.checked) {
                          newSelected.add(entry.id);
                        } else {
                          newSelected.delete(entry.id);
                        }
                        setSelected(newSelected);
                      }}
                      className="rounded border-muted-foreground"
                    />
                  </td>
                  <td className="p-3 text-foreground">{entry.name}</td>
                  <td className="p-3 text-muted-foreground font-mono text-sm truncate max-w-xs">{entry.keyPath}</td>
                  <td className="p-3">
                    <span className="badge bg-blue-500/20 text-blue-400">{entry.valueType}</span>
                  </td>
                  <td className="p-3 text-muted-foreground font-mono text-sm truncate max-w-xs">{entry.valueData}</td>
                  <td className="p-3">
                    <button
                      onClick={() => openModal(entry)}
                      className="p-1 hover:bg-dark-600 rounded"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEntry ? 'Edit Registry Entry' : 'New Registry Entry'}
        size="lg"
      >
        <RegistryForm
          entry={editingEntry || undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
