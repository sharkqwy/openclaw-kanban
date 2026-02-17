import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { Task, TaskStatus } from '@/shared/types';
import { SortableTaskCard } from './SortableTaskCard';
import { QuickAdd } from './QuickAdd';

const columnEmoji: Record<string, string> = {
  planning: '📋',
  inbox: '📥',
  active: '⚡',
  review: '🔍',
  done: '✅',
};

interface ColumnProps {
  column: { id: TaskStatus; label: string; emoji: string; color: string };
  tasks: Task[];
}

export function Column({ column, tasks }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [collapsed, setCollapsed] = useState(column.id === 'done');
  const emoji = columnEmoji[column.id] || column.emoji;

  // Collapsed Done column
  if (collapsed && column.id === 'done') {
    return (
      <div
        ref={setNodeRef}
        className={`w-[52px] flex flex-col items-center rounded-xl cursor-pointer transition-all duration-200 hover:border-accent/20 ${
          isOver ? 'border border-accent/30 bg-accent-glow' : 'border border-border-subtle bg-bg-surface/20'
        }`}
        onClick={() => setCollapsed(false)}
      >
        <div className="py-4 flex flex-col items-center gap-2.5">
          <span className="text-sm">{emoji}</span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${column.color}15`, color: column.color }}
          >
            {tasks.length}
          </span>
          <span className="text-[9px] text-text-muted uppercase tracking-[0.08em] font-medium" style={{ writingMode: 'vertical-rl' }}>
            {column.label}
          </span>
          <ChevronRight className="w-3 h-3 text-text-muted" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 min-w-[220px] max-w-[320px] flex flex-col rounded-xl transition-all duration-200 ${
        isOver
          ? 'bg-accent-glow border border-accent/25'
          : 'bg-bg-surface/20 border border-border-subtle'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-[13px]">{emoji}</span>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
            {column.label}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono"
            style={{ backgroundColor: `${column.color}12`, color: column.color }}
          >
            {tasks.length}
          </span>
          {column.id === 'done' && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-0.5 rounded hover:bg-bg-elevated text-text-muted transition-colors"
              title="Collapse"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick-add for inbox */}
      {column.id === 'inbox' && (
        <div className="border-b border-border-subtle/50">
          <QuickAdd />
        </div>
      )}

      {/* Cards */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <SortableTaskCard task={task} />
              </motion.div>
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted/50 text-[11px]">
              <span className="text-2xl mb-2 opacity-30">{emoji}</span>
              <span>Drop tasks here</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}