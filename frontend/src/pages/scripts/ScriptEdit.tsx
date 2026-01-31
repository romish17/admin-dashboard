import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiGet, apiPost, apiPut, getErrorMessage } from '@/services/api';
import { Script } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ScriptForm } from '@/components/forms/ScriptForm';
import toast from 'react-hot-toast';

export function ScriptEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [script, setScript] = useState<Script | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isNew = !id || id === 'new';

  useEffect(() => {
    if (!isNew) {
      fetchScript();
    } else {
      setIsLoading(false);
    }
  }, [id]);

  async function fetchScript() {
    try {
      const data = await apiGet<Script>(`/scripts/${id}`);
      setScript(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/scripts');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(data: {
    title: string;
    description?: string;
    content: string;
    language: Script['language'];
    version: string;
    categoryId?: string;
    tagIds: string[];
  }) {
    setIsSaving(true);
    try {
      if (isNew) {
        await apiPost('/scripts', data);
        toast.success('Script created successfully');
      } else {
        await apiPut(`/scripts/${id}`, data);
        toast.success('Script updated successfully');
      }
      navigate('/scripts');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/scripts" className="btn-ghost p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark-100">
            {isNew ? 'New Script' : 'Edit Script'}
          </h1>
          <p className="text-dark-400">
            {isNew ? 'Create a new script' : `Editing: ${script?.title}`}
          </p>
        </div>
      </div>

      <div className="card">
        <ScriptForm
          script={script || undefined}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/scripts')}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}
