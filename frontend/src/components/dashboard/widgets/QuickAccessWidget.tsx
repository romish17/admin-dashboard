import { Link } from 'react-router-dom';
import {
  CodeBracketIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  ServerIcon,
  RssIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const modules = [
  { name: 'Scripts', href: '/scripts', icon: CodeBracketIcon, color: 'bg-blue-500/20 text-blue-400' },
  { name: 'Notes', href: '/notes', icon: DocumentTextIcon, color: 'bg-emerald-500/20 text-emerald-400' },
  { name: 'Tâches', href: '/todos', icon: ClipboardDocumentListIcon, color: 'bg-amber-500/20 text-amber-400' },
  { name: 'Projets', href: '/projects', icon: FolderIcon, color: 'bg-violet-500/20 text-violet-400' },
  { name: 'Procédures', href: '/procedures', icon: BookOpenIcon, color: 'bg-pink-500/20 text-pink-400' },
  { name: 'Registres', href: '/registries', icon: ComputerDesktopIcon, color: 'bg-orange-500/20 text-orange-400' },
  { name: 'Zabbix', href: '/zabbix', icon: ServerIcon, color: 'bg-red-500/20 text-red-400' },
  { name: 'Flux RSS', href: '/rss', icon: RssIcon, color: 'bg-cyan-500/20 text-cyan-400' },
];

interface QuickAccessWidgetProps {
  size: 'sm' | 'md' | 'lg';
}

export function QuickAccessWidget({ size }: QuickAccessWidgetProps) {
  const gridCols = size === 'lg' ? 'grid-cols-4 md:grid-cols-8' : size === 'md' ? 'grid-cols-4' : 'grid-cols-2';

  return (
    <div className="card h-full">
      <h2 className="text-lg font-semibold text-dark-100 mb-4">Accès rapide</h2>
      <div className={clsx('grid gap-3', gridCols)}>
        {modules.map((module) => (
          <Link
            key={module.name}
            to={module.href}
            className="flex flex-col items-center justify-center py-4 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-colors group"
          >
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-2', module.color)}>
              <module.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-dark-400 group-hover:text-dark-200 text-center">
              {module.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
