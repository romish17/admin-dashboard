import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, getErrorMessage } from '@/services/api';
import { ZabbixItem, PaginatedResponse } from '@/types';
import { PlusIcon, MagnifyingGlassIcon, ServerIcon, PencilIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { ZabbixForm } from '@/components/forms/ZabbixForm';

const typeColors: Record<string, string> = {
  ITEM: 'bg-blue-500/20 text-blue-400',
  TRIGGER: 'bg-red-500/20 text-red-400',
  TEMPLATE: 'bg-green-500/20 text-green-400',
  HOST: 'bg-purple-500/20 text-purple-400',
  HOSTGROUP: 'bg-yellow-500/20 text-yellow-400',
  ACTION: 'bg-orange-500/20 text-orange-400',
  MACRO: 'bg-pink-500/20 text-pink-400',
  OTHER: 'bg-gray-500/20 text-gray-400',
};

export function ZabbixList() {
  const [items, setItems] = useState<ZabbixItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ZabbixItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [search, typeFilter]);

  async function fetchItems() {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (typeFilter) params.itemType = typeFilter;
      const response = await apiGet<PaginatedResponse<ZabbixItem>>('/zabbix', params);
      setItems(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  function openModal(item?: ZabbixItem) {
    setEditingItem(item || null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingItem(null);
  }

  async function handleSubmit(data: {
    name: string;
    description?: string;
    itemType: ZabbixItem['itemType'];
    content: string;
    version?: string;
    zabbixId?: string;
    categoryId?: string;
    tagIds: string[];
  }) {
    setIsSaving(true);
    try {
      // Parse JSON content
      const contentJson = JSON.parse(data.content);
      const payload = { ...data, content: contentJson };

      if (editingItem) {
        await apiPut(`/zabbix/${editingItem.id}`, payload);
        toast.success('Zabbix item updated successfully');
      } else {
        await apiPost('/zabbix', payload);
        toast.success('Zabbix item created successfully');
      }
      closeModal();
      fetchItems();
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
          <h1 className="text-2xl font-bold text-dark-100">Zabbix Items</h1>
          <p className="text-dark-400">Manage Zabbix templates, triggers, and configurations</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Item
        </button>
      </div>

      <div className="card flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search Zabbix items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Types</option>
          <option value="ITEM">Items</option>
          <option value="TRIGGER">Triggers</option>
          <option value="TEMPLATE">Templates</option>
          <option value="HOST">Hosts</option>
          <option value="HOSTGROUP">Host Groups</option>
          <option value="ACTION">Actions</option>
          <option value="MACRO">Macros</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <ServerIcon className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No Zabbix items found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="card-hover group cursor-pointer" onClick={() => openModal(item)}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ServerIcon className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-dark-100 group-hover:text-primary-400">{item.name}</h3>
                    <span className={clsx('badge', typeColors[item.itemType])}>{item.itemType}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(item); }}
                      className="p-1 hover:bg-dark-600 rounded opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                    >
                      <PencilIcon className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                  {item.description && (
                    <p className="text-dark-400 text-sm mt-1">{item.description}</p>
                  )}
                  {item.zabbixId && (
                    <p className="text-dark-500 text-xs mt-2 font-mono">Zabbix ID: {item.zabbixId}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Zabbix Item' : 'New Zabbix Item'}
        size="lg"
      >
        <ZabbixForm
          item={editingItem || undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
