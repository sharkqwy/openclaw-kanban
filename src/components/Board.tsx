import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMissionStore } from '@/store';
import type { Task, TaskStatus } from '@/shared/types';
import { TASK_COLUMNS } from '@/shared/types';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

export function Board() {
  const { tasks, updateTaskStatus, isLoading } = useMissionStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => tasks.filter((t) => t.status === status),
    [tasks]
  );

  const findTaskById = useCallback(
    (id: string) => tasks.find((t) => t.id === id) || null,
    [tasks]
  );

  const findColumnByTaskId = useCallback(
    (id: string): TaskStatus | null => {
      const task = tasks.find((t) => t.id === id);
      return task?.status || null;
    },
    [tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(findTaskById(event.active.id as string));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const sourceStatus = findColumnByTaskId(activeId);
    if (!sourceStatus) return;

    // Determine target column
    const isColumn = TASK_COLUMNS.some((c) => c.id === overId);
    const targetStatus = isColumn ? (overId as TaskStatus) : findColumnByTaskId(overId);
    if (!targetStatus || sourceStatus === targetStatus) return;

    // Optimistic update
    updateTaskStatus(activeId, targetStatus);

    // Persist
    try {
      const res = await fetch(`/api/tasks/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (res.ok) {
        // Auto-dispatch if moved to in_progress with assigned agent
        const task = findTaskById(activeId);
        if (targetStatus === 'in_progress' && task?.assigned_agent_id) {
          fetch(`/api/tasks/${activeId}/dispatch`, { method: 'POST' }).catch(console.error);
        }
      } else {
        updateTaskStatus(activeId, sourceStatus); // revert
      }
    } catch {
      updateTaskStatus(activeId, sourceStatus); // revert
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-secondary animate-pulse">Loading missions...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex gap-3 p-4 overflow-x-auto">
        {TASK_COLUMNS.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={getTasksByStatus(col.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
