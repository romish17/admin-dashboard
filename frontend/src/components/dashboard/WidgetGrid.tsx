import { useState } from 'react';
import { Settings, GripVertical, Plus, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  size: 'sm' | 'md' | 'lg';
  visible: boolean;
  order: number;
}

interface WidgetGridProps {
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  renderWidget: (widget: WidgetConfig) => React.ReactNode;
  availableWidgets: { type: string; title: string; defaultSize: 'sm' | 'md' | 'lg' }[];
}

export function WidgetGrid({ widgets, onWidgetsChange, renderWidget, availableWidgets }: WidgetGridProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const visibleWidgets = widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  const hiddenWidgets = widgets.filter(w => !w.visible);

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetWidgetId) return;

    const newWidgets = [...widgets];
    const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = newWidgets.findIndex(w => w.id === targetWidgetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Swap orders
    const draggedOrder = newWidgets[draggedIndex].order;
    newWidgets[draggedIndex].order = newWidgets[targetIndex].order;
    newWidgets[targetIndex].order = draggedOrder;

    onWidgetsChange(newWidgets);
    setDraggedWidget(null);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const newWidgets = widgets.map(w =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    );
    onWidgetsChange(newWidgets);
  };

  const changeWidgetSize = (widgetId: string, size: 'sm' | 'md' | 'lg') => {
    const newWidgets = widgets.map(w =>
      w.id === widgetId ? { ...w, size } : w
    );
    onWidgetsChange(newWidgets);
  };

  const addWidget = (type: string) => {
    const widgetDef = availableWidgets.find(w => w.type === type);
    if (!widgetDef) return;

    const existingWidget = widgets.find(w => w.type === type);
    if (existingWidget) {
      // Just make it visible
      toggleWidgetVisibility(existingWidget.id);
    } else {
      // Add new widget
      const maxOrder = Math.max(...widgets.map(w => w.order), 0);
      const newWidget: WidgetConfig = {
        id: `widget-${type}-${Date.now()}`,
        type,
        title: widgetDef.title,
        size: widgetDef.defaultSize,
        visible: true,
        order: maxOrder + 1,
      };
      onWidgetsChange([...widgets, newWidget]);
    }
    setShowAddPanel(false);
  };

  const getWidgetGridClass = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm': return 'col-span-1';
      case 'md': return 'col-span-1 lg:col-span-2';
      case 'lg': return 'col-span-1 lg:col-span-3';
      default: return 'col-span-1';
    }
  };

  return (
    <div className="space-y-4">
      {/* Edit mode toggle */}
      <div className="flex items-center justify-end gap-2">
        {isEditMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddPanel(!showAddPanel)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter un widget
          </Button>
        )}
        <Button
          variant={isEditMode ? "default" : "secondary"}
          size="sm"
          onClick={() => {
            setIsEditMode(!isEditMode);
            setShowAddPanel(false);
          }}
        >
          <Settings className="w-4 h-4 mr-2" />
          {isEditMode ? 'Terminer' : 'Personnaliser'}
        </Button>
      </div>

      {/* Add widget panel */}
      {showAddPanel && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-medium text-foreground mb-3">Widgets disponibles</h3>
          <div className="flex flex-wrap gap-2">
            {availableWidgets.map(widgetDef => {
              const isActive = widgets.some(w => w.type === widgetDef.type && w.visible);
              return (
                <Button
                  key={widgetDef.type}
                  variant="secondary"
                  size="sm"
                  onClick={() => addWidget(widgetDef.type)}
                  disabled={isActive}
                >
                  {widgetDef.title}
                  {isActive && ' (actif)'}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Widget grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {visibleWidgets.map(widget => (
          <div
            key={widget.id}
            className={cn(
              getWidgetGridClass(widget.size),
              'relative group',
              isEditMode && 'cursor-move',
              draggedWidget === widget.id && 'opacity-50'
            )}
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, widget.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widget.id)}
            onDragEnd={handleDragEnd}
          >
            {/* Edit overlay */}
            {isEditMode && (
              <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-border flex items-start justify-between p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="w-5 h-5" />
                  <span className="text-sm font-medium">{widget.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Size buttons */}
                  <div className="flex bg-muted rounded-lg p-0.5 mr-2">
                    {(['sm', 'md', 'lg'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => changeWidgetSize(widget.id, size)}
                        className={cn(
                          'px-2 py-1 text-xs rounded transition-colors',
                          widget.size === size
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  {/* Hide button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    title="Masquer"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {renderWidget(widget)}
          </div>
        ))}
      </div>

      {/* Hidden widgets (in edit mode) */}
      {isEditMode && hiddenWidgets.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Widgets masqués</h3>
          <div className="flex flex-wrap gap-2">
            {hiddenWidgets.map(widget => (
              <Button
                key={widget.id}
                variant="secondary"
                size="sm"
                onClick={() => toggleWidgetVisibility(widget.id)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {widget.title}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
