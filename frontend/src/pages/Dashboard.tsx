import { useState, useEffect } from 'react';
import { WidgetGrid, WidgetConfig } from '@/components/dashboard/WidgetGrid';
import {
  QuickAccessWidget,
  FavoritesWidget,
  TodosWidget,
  RssWidget,
  ClockWidget,
} from '@/components/dashboard/widgets';

const STORAGE_KEY = 'dashboard-widgets';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'quick-access', type: 'quick-access', title: 'Accès rapide', size: 'lg', visible: true, order: 1 },
  { id: 'favorites', type: 'favorites', title: 'Favoris', size: 'sm', visible: true, order: 2 },
  { id: 'todos', type: 'todos', title: 'Tâches', size: 'sm', visible: true, order: 3 },
  { id: 'rss', type: 'rss', title: 'Flux RSS', size: 'sm', visible: true, order: 4 },
  { id: 'clock', type: 'clock', title: 'Horloge', size: 'sm', visible: false, order: 5 },
];

const AVAILABLE_WIDGETS = [
  { type: 'quick-access', title: 'Accès rapide', defaultSize: 'lg' as const },
  { type: 'favorites', title: 'Favoris', defaultSize: 'sm' as const },
  { type: 'todos', title: 'Tâches', defaultSize: 'sm' as const },
  { type: 'rss', title: 'Flux RSS', defaultSize: 'sm' as const },
  { type: 'clock', title: 'Horloge', defaultSize: 'sm' as const },
];

export function Dashboard() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_WIDGETS;
      }
    }
    return DEFAULT_WIDGETS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'quick-access':
        return <QuickAccessWidget size={widget.size} />;
      case 'favorites':
        return <FavoritesWidget />;
      case 'todos':
        return <TodosWidget />;
      case 'rss':
        return <RssWidget />;
      case 'clock':
        return <ClockWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Tableau de bord</h1>
        <p className="text-dark-400">Bienvenue sur NexusHub</p>
      </div>

      <WidgetGrid
        widgets={widgets}
        onWidgetsChange={setWidgets}
        renderWidget={renderWidget}
        availableWidgets={AVAILABLE_WIDGETS}
      />
    </div>
  );
}
