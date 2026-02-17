import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { Task, TaskStatus } from '@/shared/types';
import { SortableTaskCard } from './SortableTaskCard';
import { QuickAdd } from './QuickAdd';

interface ColumnProps {
  column: { id: TaskStatus; label: string; emoji: string; color: string };
  tasks: Task[];
}

export function Column({ column, tasks }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [collapsed, setCollapsed] = useState(column.id === 'done');

  // Collapsed Done column
  if (collapsed && column.id === 'done') {
    return (
      <div
        ref={setNodeRef}
        className={`w-14 flex flex-col items-center rounded-xl border cursor-pointer transition-all duration-200 hover:border-accent/30 ${
          isOver ? 'border-accent/40 bg-accent/5' : 'border-border-subtle bg-bg-surface/30'
        }`}
        onClick={() => setCollapsed(false)}
      >
        <div className="py-3 flex flex-col items-center gap-2">
          <span className="text-sm">{column.emoji}</span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${column.color}20`, color: column.color }}
          >
            {tasks.length}
          </span>
          <span className="text-[9px] text-text-muted uppercase tracking-wider" style={{ writingMode: 'vertical-rl' }}>
            {column.label}
          </span>
          <ChevronRight className="w-3 h-3 text-text-muted" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 min-w-[220px] max-w-[320px] flex flex-col rounded-xl border transition-all duration-200 ${
        isOver
          ? 'border-accent/40 bg-accent/5 shadow-lg shadow-accent/10'
          : 'border-border-subtle bg-bg-surface/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-sm">{column.emoji}</span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {column.label}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${column.color}20`, color: column.color }}
          >
            {tasks.length}
          </span>
          {column.id === 'done' && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-0.5 rounded hover:bg-bg-elevated text-text-muted"
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
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <SortableTaskCard task={task} />
              </motion.div>
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted text-xs">
              <span className="text-2xl mb-1 opacity-30">📋</span>
              <span>Drop tasks here</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
