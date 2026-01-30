import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '@/services/api';
import { Todo } from '@/types';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const priorityConfig = {
  URGENT: { icon: ExclamationCircleIcon, color: 'text-red-400', bg: 'bg-red-500/20' },
  HIGH: { icon: ExclamationCircleIcon, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  MEDIUM: { icon: ClockIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  LOW: { icon: CheckCircleIcon, color: 'text-green-400', bg: 'bg-green-500/20' },
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
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
          <ClipboardDocumentListIcon className="w-5 h-5 text-primary-400" />
          Tâches prioritaires
        </h2>
        <Link to="/todos" className="text-sm text-primary-400 hover:text-primary-300">
          Voir tout
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : todos.length === 0 ? (
        <p className="text-dark-400 text-sm">Aucune tâche prioritaire. Tout est à jour !</p>
      ) : (
        <div className="space-y-2">
          {todos.slice(0, 6).map((todo) => {
            const config = priorityConfig[todo.priority];
            return (
              <div
                key={todo.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
              >
                <div className={clsx('p-1.5 rounded-lg flex-shrink-0', config.bg)}>
                  <config.icon className={clsx('w-4 h-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-200 truncate">{todo.title}</p>
                  {todo.project && (
                    <p className="text-xs text-dark-500">{todo.project.name}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
