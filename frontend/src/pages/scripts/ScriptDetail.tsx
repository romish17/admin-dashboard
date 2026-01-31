import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiGet, apiDelete, apiPost, getErrorMessage } from '@/services/api';
import { Script } from '@/types';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  ClipboardIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const languageMap: Record<string, string> = {
  BASH: 'bash',
  POWERSHELL: 'powershell',
  PYTHON: 'python',
  JAVASCRIPT: 'javascript',
  SQL: 'sql',
  OTHER: 'text',
};

export function ScriptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [script, setScript] = useState<Script | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id && id !== 'new') {
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

  async function handleDelete() {
    if (!script || !confirm('Are you sure you want to delete this script?')) return;

    try {
      await apiDelete(`/scripts/${script.id}`);
      toast.success('Script deleted');
      navigate('/scripts');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function toggleFavorite() {
    if (!script) return;
    try {
      await apiPost(`/scripts/${script.id}/favorite`);
      setScript({ ...script, isFavorite: !script.isFavorite });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function copyToClipboard() {
    if (!script) return;
    navigator.clipboard.writeText(script.content);
    toast.success('Copied to clipboard');
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!script) {
    return <div className="text-dark-400">Script not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/scripts" className="btn-ghost p-2">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">{script.title}</h1>
            <p className="text-dark-400 text-sm">
              Version {script.version} • Updated {formatDistanceToNow(new Date(script.updatedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleFavorite} className="btn-ghost p-2">
            {script.isFavorite ? (
              <StarSolidIcon className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarIcon className="w-5 h-5" />
            )}
          </button>
          <button onClick={copyToClipboard} className="btn-secondary">
            <ClipboardIcon className="w-5 h-5 mr-2" />
            Copy
          </button>
          <Link to={`/scripts/${script.id}/edit`} className="btn-secondary">
            <PencilIcon className="w-5 h-5 mr-2" />
            Edit
          </Link>
          <button onClick={handleDelete} className="btn-danger">
            <TrashIcon className="w-5 h-5 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <span className={clsx(
            'badge',
            script.language === 'BASH' && 'bg-green-500/20 text-green-400',
            script.language === 'POWERSHELL' && 'bg-blue-500/20 text-blue-400',
            script.language === 'PYTHON' && 'bg-yellow-500/20 text-yellow-400',
          )}>
            {script.language}
          </span>
          {script.category && (
            <span
              className="badge"
              style={{ backgroundColor: `${script.category.color}20`, color: script.category.color }}
            >
              {script.category.name}
            </span>
          )}
          {script.tags.map((tag) => (
            <span key={tag.id} className="text-sm text-dark-400">#{tag.name}</span>
          ))}
        </div>
        {script.description && (
          <p className="text-dark-300 mt-4">{script.description}</p>
        )}
      </div>

      {/* Code */}
      <div className="card p-0 overflow-hidden">
        <div className="bg-dark-950 p-4 border-b border-dark-700 flex items-center justify-between">
          <span className="text-sm text-dark-400">Script Content</span>
          <span className="text-xs text-dark-500">{script.content.split('\n').length} lines</span>
        </div>
        <SyntaxHighlighter
          language={languageMap[script.language] || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            background: '#0a0a0f',
          }}
          showLineNumbers
        >
          {script.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
