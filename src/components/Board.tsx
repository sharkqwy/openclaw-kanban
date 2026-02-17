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
  type DragOverEvent,
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
  const [, setDragOverAgent] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => tasks.filter((t) => t.status === status && !t.parent_task_id),
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

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string;
    // Check if dragging over an agent in sidebar
    if (overId?.startsWith('agent-drop-')) {
      setDragOverAgent(overId.replace('agent-drop-', ''));
    } else {
      setDragOverAgent(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setDragOverAgent(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const sourceStatus = findColumnByTaskId(activeId);
    if (!sourceStatus) return;

    // Dropped on agent → assign + move to active
    if (overId.startsWith('agent-drop-')) {
      const agentId = overId.replace('agent-drop-', '');
      updateTaskStatus(activeId, 'active');
      try {
        const res = await fetch(`/api/tasks/${activeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active', assigned_agent_id: agentId }),
        });
        if (!res.ok) updateTaskStatus(activeId, sourceStatus);
      } catch {
        updateTaskStatus(activeId, sourceStatus);
      }
      return;
    }

    // Determine target column
    const isColumn = TASK_COLUMNS.some((c) => c.id === overId);
    const targetStatus = isColumn ? (overId as TaskStatus) : findColumnByTaskId(overId);
    if (!targetStatus || sourceStatus === targetStatus) return;

    updateTaskStatus(activeId, targetStatus);

    try {
      const res = await fetch(`/api/tasks/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (res.ok) {
        const task = findTaskById(activeId);
        if (targetStatus === 'active' && task?.assigned_agent_id) {
          fetch(`/api/tasks/${activeId}/dispatch`, { method: 'POST' }).catch(console.error);
        }
      } else {
        updateTaskStatus(activeId, sourceStatus);
      }
    } catch {
      updateTaskStatus(activeId, sourceStatus);
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
      onDragOver={handleDragOver}
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
