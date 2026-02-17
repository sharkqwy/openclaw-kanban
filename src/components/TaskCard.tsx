import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMissionStore } from '@/store';
import type { Task } from '@/shared/types';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityColors: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f59e0b',
  normal: '#22c55e',
  low: '#6b7280',
};

const priorityStyles = {
  low: { dot: 'bg-text-muted', text: 'text-text-muted' },
  normal: { dot: 'bg-accent', text: 'text-accent' },
  high: { dot: 'bg-warning', text: 'text-warning' },
  urgent: { dot: 'bg-danger', text: 'text-danger' },
};

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const setSelectedTask = useMissionStore((s) => s.setSelectedTask);
  const tasks = useMissionStore((s) => s.tasks);
  const [expanded, setExpanded] = useState(false);
  const p = priorityStyles[task.priority];
  const borderColor = priorityColors[task.priority] || priorityColors.normal;

  const isEpic = !!task.is_epic;
  const childTasks = isEpic ? tasks.filter((t) => t.parent_task_id === task.id) : [];
  const childDone = childTasks.filter((t) => t.status === 'done').length;
  const progress = task.child_progress || (isEpic ? { total: childTasks.length, done: childDone } : null);

  const tags: string[] = task.tags ? (() => { try { return JSON.parse(task.tags); } catch { return []; } })() : [];

  return (
    <div
      onClick={(e) => {
        if (isDragging) return;
        if ((e.target as HTMLElement).closest('[data-expand-toggle]')) return;
        setSelectedTask(task);
      }}
      className={`group relative rounded-[10px] cursor-pointer transition-all duration-200 ${
        isDragging
          ? 'opacity-80 scale-[1.03] rotate-[1.5deg]'
          : 'hover:shadow-[var(--shadow-card-hover)]'
      }`}
      style={{
        background: isDragging
          ? 'var(--color-bg-elevated)'
          : 'var(--color-bg-surface)',
        boxShadow: isDragging ? 'var(--shadow-drag)' : 'var(--shadow-card)',
        borderLeft: `3px solid ${borderColor}`,
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLElement).style.background =
            'linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-surface))';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-surface)';
        }
      }}
    >
      <div className="p-3 py-[12px] px-[14px]">
        {/* EPIC indicator + expand toggle */}
        {isEpic && (
          <div className="flex items-center gap-1.5 mb-2">
            <button
              data-expand-toggle
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="p-0.5 hover:bg-bg-elevated rounded transition-colors"
            >
              {expanded ? <ChevronDown className="w-3 h-3 text-accent" /> : <ChevronRight className="w-3 h-3 text-accent" />}
            </button>
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-accent">EPIC</span>
            {progress && progress.total > 0 && (
              <span className="text-[10px] text-text-muted ml-auto font-mono">{progress.done}/{progress.total}</span>
            )}
          </div>
        )}

        {/* Title */}
        <h4 className="text-[13px] font-medium leading-snug line-clamp-2 mb-2 tracking-[-0.01em]">
          {task.title}
        </h4>

        {/* EPIC progress bar */}
        {isEpic && progress && progress.total > 0 && (
          <div className="mb-2">
            <div className="h-[2px] bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Planning indicator */}
        {task.status === 'planning' && (
          <div className="flex items-center gap-2 mb-2 py-1.5 px-2.5 bg-info/8 rounded-lg border border-info/15">
            <div className="w-1.5 h-1.5 bg-info rounded-full animate-pulse-soft" />
            <span className="text-[10px] text-info font-medium">Planning in progress</span>
          </div>
        )}

        {/* Assigned agent */}
        {task.assigned_agent && (
          <div className="flex items-center gap-1.5 mb-2 py-1 px-2 bg-bg-elevated/60 rounded-md text-[11px] text-text-secondary">
            <span className="text-xs">{task.assigned_agent.avatar_emoji}</span>
            <span className="truncate">{task.assigned_agent.name}</span>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent/80 rounded-md font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description preview */}
        {task.description && (
          <p className="text-[11px] text-text-muted line-clamp-1 mb-2">{task.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-1.5">
            <div className={`w-[5px] h-[5px] rounded-full ${p.dot}`} />
            <span className={`text-[10px] capitalize font-medium ${p.text}`}>{task.priority}</span>
          </div>
          <span className="text-[10px] text-text-muted">
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Expanded child tasks for EPICs */}
      {isEpic && expanded && childTasks.length > 0 && (
        <div className="border-t border-border-subtle px-3 py-2 space-y-0.5">
          {childTasks.map((child) => (
            <div
              key={child.id}
              onClick={(e) => { e.stopPropagation(); setSelectedTask(child); }}
              className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-bg-elevated text-[12px] cursor-pointer transition-colors"
            >
              <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${child.status === 'done' ? 'bg-accent' : child.status === 'active' ? 'bg-accent/60' : 'bg-text-muted'}`} />
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