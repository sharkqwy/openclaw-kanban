/**
 * BoardColumns — Pure column rendering (used inside DndContext from BoardView)
 */
import type { TaskStatus } from '@/shared/types';
import { TASK_COLUMNS } from '@/shared/types';
import type { Task } from '@/shared/types';
import { Column } from './Column';

interface BoardColumnsProps {
  getTasksByStatus: (status: TaskStatus) => Task[];
}

export function BoardColumns({ getTasksByStatus }: BoardColumnsProps) {
  return (
    <div className="flex-1 flex gap-3 p-4 overflow-x-auto">
      {TASK_COLUMNS.map((col) => (
        <Column
          key={col.id}
          column={col}
          tasks={getTasksByStatus(col.id)}
        />
      ))}
    </div>
  );
}
