import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { PlusIcon } from '@heroicons/react/24/outline';

export interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  items: KanbanItem[];
  onItemMove: (itemId: string, newStatus: string, newIndex: number) => void;
  onItemClick?: (item: KanbanItem) => void;
  onAddItem?: (status: string) => void;
}

interface SortableItemProps {
  item: KanbanItem;
  onClick?: () => void;
}

const priorityColors: Record<string, string> = {
  LOW: 'border-l-slate-500',
  MEDIUM: 'border-l-blue-500',
  HIGH: 'border-l-orange-500',
  URGENT: 'border-l-red-500',
};

function SortableItem({ item, onClick }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={clsx(
        'p-3 bg-dark-700 rounded-lg border-l-4 cursor-grab active:cursor-grabbing',
        'hover:bg-dark-600 transition-colors',
        item.priority ? priorityColors[item.priority] : 'border-l-dark-500',
        isDragging && 'opacity-50'
      )}
    >
      <h4 className="text-sm font-medium text-dark-100">{item.title}</h4>
      {item.description && (
        <p className="text-xs text-dark-400 mt-1 line-clamp-2">{item.description}</p>
      )}
      {item.dueDate && (
        <p className="text-xs text-dark-500 mt-2">
          {new Date(item.dueDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function KanbanItemPreview({ item }: { item: KanbanItem }) {
  return (
    <div
      className={clsx(
        'p-3 bg-dark-700 rounded-lg border-l-4 shadow-lg',
        item.priority ? priorityColors[item.priority] : 'border-l-dark-500'
      )}
    >
      <h4 className="text-sm font-medium text-dark-100">{item.title}</h4>
      {item.description && (
        <p className="text-xs text-dark-400 mt-1 line-clamp-2">{item.description}</p>
      )}
    </div>
  );
}

export function KanbanBoard({
  columns,
  items,
  onItemMove,
  onItemClick,
  onAddItem,
}: KanbanBoardProps) {
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const itemsByColumn = useMemo(() => {
    const result: Record<string, KanbanItem[]> = {};
    columns.forEach((col) => {
      result[col.id] = items.filter((item) => item.status === col.id);
    });
    return result;
  }, [columns, items]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const item = items.find((i) => i.id === active.id);
    if (item) {
      setActiveItem(item);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeItem = items.find((i) => i.id === active.id);
    if (!activeItem) return;

    const overId = over.id as string;

    // Check if over a column
    const overColumn = columns.find((col) => col.id === overId);
    if (overColumn && activeItem.status !== overColumn.id) {
      // Move to empty column or to the end of a column
      const columnItems = itemsByColumn[overColumn.id];
      onItemMove(activeItem.id, overColumn.id, columnItems.length);
      return;
    }

    // Check if over another item
    const overItem = items.find((i) => i.id === overId);
    if (overItem && activeItem.status !== overItem.status) {
      // Moving to a different column
      const overColumnItems = itemsByColumn[overItem.status];
      const overIndex = overColumnItems.findIndex((i) => i.id === overItem.id);
      onItemMove(activeItem.id, overItem.status, overIndex);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeItem = items.find((i) => i.id === active.id);
    if (!activeItem) return;

    const overId = over.id as string;

    // If dropped on a column
    const overColumn = columns.find((col) => col.id === overId);
    if (overColumn) {
      if (activeItem.status !== overColumn.id) {
        const columnItems = itemsByColumn[overColumn.id];
        onItemMove(activeItem.id, overColumn.id, columnItems.length);
      }
      return;
    }

    // If dropped on another item
    const overItem = items.find((i) => i.id === overId);
    if (overItem) {
      const columnItems = itemsByColumn[overItem.status];
      const oldIndex = columnItems.findIndex((i) => i.id === active.id);
      const newIndex = columnItems.findIndex((i) => i.id === over.id);

      if (oldIndex !== -1 && oldIndex !== newIndex) {
        onItemMove(activeItem.id, overItem.status, newIndex);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnItems = itemsByColumn[column.id] || [];
          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 bg-dark-800/50 rounded-xl p-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {column.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                  )}
                  <h3 className="font-medium text-dark-200">{column.title}</h3>
                  <span className="text-xs text-dark-500 bg-dark-700 px-2 py-0.5 rounded-full">
                    {columnItems.length}
                  </span>
                </div>
                {onAddItem && (
                  <button
                    onClick={() => onAddItem(column.id)}
                    className="p-1 hover:bg-dark-700 rounded transition-colors"
                    title={`Add to ${column.title}`}
                  >
                    <PlusIcon className="w-4 h-4 text-dark-400" />
                  </button>
                )}
              </div>

              {/* Column Content */}
              <SortableContext
                items={columnItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className="space-y-2 min-h-[200px]"
                  data-column-id={column.id}
                >
                  {columnItems.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onClick={() => onItemClick?.(item)}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem ? <KanbanItemPreview item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
