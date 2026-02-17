import { formatDistanceToNow } from 'date-fns';
import { useMissionStore } from '@/store';
import type { Task } from '@/shared/types';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityStyles = {
  low: { dot: 'bg-text-secondary/40', text: 'text-text-secondary' },
  normal: { dot: 'bg-accent', text: 'text-accent' },
  high: { dot: 'bg-amber-400', text: 'text-amber-400' },
  urgent: { dot: 'bg-red-500', text: 'text-red-500' },
};

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const setSelectedTask = useMissionStore((s) => s.setSelectedTask);
  const p = priorityStyles[task.priority];

  return (
    <div
      onClick={() => !isDragging && setSelectedTask(task)}
      className={`group bg-bg-surface border rounded-lg cursor-pointer transition-all duration-150 hover:border-accent/30 hover:shadow-lg hover:shadow-black/20 ${
        isDragging ? 'opacity-60 scale-95 shadow-2xl rotate-2' : 'border-border-subtle'
      } ${task.status === 'planning' ? 'border-purple-500/30' : ''}`}
    >
      <div className="p-3">
        {/* Title */}
        <h4 className="text-sm font-medium leading-snug line-clamp-2 mb-2">
          {task.title}
        </h4>

        {/* Planning indicator */}
        {task.status === 'planning' && (
          <div className="flex items-center gap-2 mb-2 py-1.5 px-2 bg-purple-500/10 rounded border border-purple-500/20">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-purple-400 font-medium">Planning in progress</span>
          </div>
        )}

        {/* Assigned agent */}
        {task.assigned_agent && (
          <div className="flex items-center gap-1.5 mb-2 py-1 px-2 bg-bg-elevated/50 rounded text-xs text-text-secondary">
            <span>{task.assigned_agent.avatar_emoji}</span>
            <span className="truncate">{task.assigned_agent.name}</span>
          </div>
        )}

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-text-muted line-clamp-1 mb-2">{task.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
            <span className={`text-[10px] capitalize ${p.text}`}>{task.priority}</span>
          </div>
          <span className="text-[10px] text-text-muted">
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
