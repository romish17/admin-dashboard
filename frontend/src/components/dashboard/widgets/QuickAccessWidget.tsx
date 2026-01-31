import { Link } from 'react-router-dom';
import {
  Code,
  FileText,
  ClipboardList,
  BookOpen,
  Monitor,
  Server,
  Rss,
  Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const modules = [
  { name: 'Scripts', href: '/scripts', icon: Code, color: 'bg-blue-500/20 text-blue-400' },
  { name: 'Notes', href: '/notes', icon: FileText, color: 'bg-emerald-500/20 text-emerald-400' },
  { name: 'Tâches', href: '/todos', icon: ClipboardList, color: 'bg-amber-500/20 text-amber-400' },
  { name: 'Projets', href: '/projects', icon: Folder, color: 'bg-violet-500/20 text-violet-400' },
  { name: 'Procédures', href: '/procedures', icon: BookOpen, color: 'bg-pink-500/20 text-pink-400' },
  { name: 'Registres', href: '/registries', icon: Monitor, color: 'bg-orange-500/20 text-orange-400' },
  { name: 'Zabbix', href: '/zabbix', icon: Server, color: 'bg-red-500/20 text-red-400' },
  { name: 'Flux RSS', href: '/rss', icon: Rss, color: 'bg-cyan-500/20 text-cyan-400' },
];

interface QuickAccessWidgetProps {
  size: 'sm' | 'md' | 'lg';
}

export function QuickAccessWidget({ size }: QuickAccessWidgetProps) {
  const gridCols = size === 'lg' ? 'grid-cols-4 md:grid-cols-8' : size === 'md' ? 'grid-cols-4' : 'grid-cols-2';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Accès rapide</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('grid gap-3', gridCols)}>
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.name}
                to={module.href}
                className="flex flex-col items-center justify-center py-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-2', module.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground text-center">
                  {module.name}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
