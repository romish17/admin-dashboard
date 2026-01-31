import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiGet, apiDelete, apiPost, getErrorMessage } from '@/services/api';
import { Script } from '@/types';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Star,
  Clipboard,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
    return <div className="text-muted-foreground">Script not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/scripts" className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{script.title}</h1>
            <p className="text-muted-foreground text-sm">
              Version {script.version} • Updated {formatDistanceToNow(new Date(script.updatedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleFavorite} className="btn-ghost p-2">
            {script.isFavorite ? (
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            ) : (
              <Star className="w-5 h-5" />
            )}
          </button>
          <button onClick={copyToClipboard} className="btn-secondary">
            <Clipboard className="w-5 h-5 mr-2" />
            Copy
          </button>
          <Link to={`/scripts/${script.id}/edit`} className="btn-secondary">
            <Pencil className="w-5 h-5 mr-2" />
            Edit
          </Link>
          <button onClick={handleDelete} className="btn-danger">
            <Trash2 className="w-5 h-5 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <span className={cn(
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
            <span key={tag.id} className="text-sm text-muted-foreground">#{tag.name}</span>
          ))}
        </div>
        {script.description && (
          <p className="text-muted-foreground mt-4">{script.description}</p>
        )}
      </div>

      {/* Code */}
      <div className="card p-0 overflow-hidden">
        <div className="bg-dark-950 p-4 border-b border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Script Content</span>
          <span className="text-xs text-muted-foreground">{script.content.split('\n').length} lines</span>
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
