import { useState, useEffect } from 'react';
import { WidgetGrid, WidgetConfig } from '@/components/dashboard/WidgetGrid';
import {
  FavoritesWidget,
  TodosWidget,
  RssWidget,
  ClockWidget,
} from '@/components/dashboard/widgets';

const STORAGE_KEY = 'dashboard-widgets-v2';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'favorites', type: 'favorites', title: 'Favoris', size: 'md', visible: true, order: 1 },
  { id: 'todos', type: 'todos', title: 'Tâches', size: 'md', visible: true, order: 2 },
  { id: 'rss', type: 'rss', title: 'Flux RSS', size: 'md', visible: true, order: 3 },
  { id: 'clock', type: 'clock', title: 'Horloge', size: 'sm', visible: true, order: 4 },
];

const AVAILABLE_WIDGETS = [
  { type: 'favorites', title: 'Favoris', defaultSize: 'md' as const },
  { type: 'todos', title: 'Tâches', defaultSize: 'md' as const },
  { type: 'rss', title: 'Flux RSS', defaultSize: 'md' as const },
  { type: 'clock', title: 'Horloge', defaultSize: 'sm' as const },
];

export function Dashboard() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out any old quick-access widgets
        return parsed.filter((w: WidgetConfig) => w.type !== 'quick-access');
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
    <WidgetGrid
      widgets={widgets}
      onWidgetsChange={setWidgets}
      renderWidget={renderWidget}
      availableWidgets={AVAILABLE_WIDGETS}
    />
  );
}
