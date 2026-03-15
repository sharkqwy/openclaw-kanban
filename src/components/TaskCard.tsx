import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
  const tasks = useMissionStore((s) => s.tasks);
  const [expanded, setExpanded] = useState(false);
  const p = priorityStyles[task.priority];

  const isEpic = !!task.is_epic;
  const childTasks = isEpic ? tasks.filter((t) => t.parent_task_id === task.id) : [];
  const childDone = childTasks.filter((t) => t.status === 'done').length;
  const progress = task.child_progress || (isEpic ? { total: childTasks.length, done: childDone } : null);

  const tags: string[] = task.tags ? (() => { try { return JSON.parse(task.tags); } catch { return []; } })() : [];

  return (
    <div
      onClick={(e) => {
        if (isDragging) return;
        // Don't open modal when clicking expand toggle
        if ((e.target as HTMLElement).closest('[data-expand-toggle]')) return;
        setSelectedTask(task);
      }}
      className={`group bg-bg-surface border rounded-lg cursor-pointer transition-all duration-150 hover:border-accent/30 hover:shadow-lg hover:shadow-black/20 ${
        isDragging ? 'opacity-60 scale-95 shadow-2xl rotate-2' : 'border-border-subtle'
      } ${task.status === 'planning' ? 'border-purple-500/30' : ''} ${isEpic ? 'border-l-2 border-l-amber-500' : ''}`}
    >
      <div className="p-3">
        {/* EPIC indicator + expand toggle */}
        {isEpic && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <button
              data-expand-toggle
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="p-0.5 hover:bg-bg-elevated rounded"
            >
              {expanded ? <ChevronDown className="w-3 h-3 text-amber-400" /> : <ChevronRight className="w-3 h-3 text-amber-400" />}
            </button>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">EPIC</span>
            {progress && progress.total > 0 && (
              <span className="text-[9px] text-text-muted ml-auto">{progress.done}/{progress.total}</span>
            )}
          </div>
        )}

        {/* Title */}
        <h4 className="text-sm font-medium leading-snug line-clamp-2 mb-2">
          {task.title}
        </h4>

        {/* EPIC progress bar */}
        {isEpic && progress && progress.total > 0 && (
          <div className="mb-2">
            <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

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

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-accent/10 text-accent rounded">
                {tag}
              </span>
            ))}
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

      {/* Expanded child tasks for EPICs */}
      {isEpic && expanded && childTasks.length > 0 && (
        <div className="border-t border-border-subtle/50 px-3 py-2 space-y-1">
          {childTasks.map((child) => (
            <div
              key={child.id}
              onClick={(e) => { e.stopPropagation(); setSelectedTask(child); }}
              className="flex items-center gap-2 py-1 px-2 rounded hover:bg-bg-elevated text-xs cursor-pointer"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${child.status === 'done' ? 'bg-emerald-400' : child.status === 'active' ? 'bg-accent' : 'bg-text-muted'}`} />
              <span className={`flex-1 truncate ${child.status === 'done' ? 'line-through text-text-muted' : ''}`}>
                {child.title}
              </span>
              {child.assigned_agent && <span className="text-[10px]">{child.assigned_agent.avatar_emoji}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
