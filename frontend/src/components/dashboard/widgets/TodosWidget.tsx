import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '@/services/api';
import { Todo } from '@/types';
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const priorityConfig = {
  URGENT: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
  HIGH: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  MEDIUM: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  LOW: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
};

export function TodosWidget() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGet<Todo[]>('/todos/dashboard')
      .then(setTodos)
      .catch(() => setTodos([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Tâches prioritaires
          </CardTitle>
          <Link to="/todos" className="text-sm text-primary hover:text-primary/80">
            Voir tout
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : todos.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune tâche prioritaire. Tout est à jour !</p>
        ) : (
          <div className="space-y-2">
            {todos.slice(0, 6).map((todo) => {
              const config = priorityConfig[todo.priority];
              const Icon = config.icon;
              return (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className={cn('p-1.5 rounded-lg flex-shrink-0', config.bg)}>
                    <Icon className={cn('w-4 h-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{todo.title}</p>
                    {todo.project && (
                      <p className="text-xs text-muted-foreground">{todo.project.name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
