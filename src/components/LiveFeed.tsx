import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useMissionStore } from '@/store';
type FeedFilter = 'all' | 'tasks' | 'agents';

const eventIcons: Record<string, string> = {
  task_created: '📋',
  task_assigned: '👤',
  task_status_changed: '🔄',
  task_completed: '✅',
  agent_joined: '🎉',
  agent_status_changed: '🔔',
  system: '⚙️',
};

export function LiveFeed() {
  const { events } = useMissionStore();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [minimized, setMinimized] = useState(false);

  const filtered = events.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'tasks') return e.type.startsWith('task_');
    return e.type.startsWith('agent_');
  });

  if (minimized) {
    return (
      <aside className="w-11 bg-bg-surface border-l border-border-subtle flex flex-col items-center py-3 transition-all duration-250 ease-out">
        <button onClick={() => setMinimized(false)} className="p-1 rounded hover:bg-bg-elevated text-text-secondary">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {events.length > 0 && (
          <span className="mt-2 w-5 h-5 bg-accent/20 text-accent rounded-full flex items-center justify-center text-[9px] font-bold">
            {events.length}
          </span>
        )}
      </aside>
    );
  }

  return (
    <aside className="w-[280px] bg-bg-surface border-l border-border-subtle flex flex-col shrink-0 transition-all duration-250 ease-out">
      {/* Header */}
      <div className="p-3 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Live Feed</span>
          <button onClick={() => setMinimized(true)} className="p-1 rounded hover:bg-bg-elevated text-text-secondary">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-1">
          {(['all', 'tasks', 'agents'] as FeedFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 text-[10px] rounded uppercase tracking-wider transition-colors ${
                filter === tab ? 'bg-accent text-bg-deep font-bold' : 'text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-text-muted/50 text-[11px]">
            <span className="text-3xl mb-2 opacity-30">📡</span>
            <span>No events yet</span>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm">{eventIcons[event.type] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed">{event.message}</p>
                    <span className="text-[10px] text-text-muted">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </aside>
  );
}
