import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Activity, Filter } from 'lucide-react';
import { useMissionStore } from '@/store';

type EventFilter = 'all' | 'tasks' | 'agents' | 'system';

const eventMeta: Record<string, { icon: string; color: string }> = {
  task_created: { icon: '📋', color: '#3b82f6' },
  task_assigned: { icon: '👤', color: '#a855f7' },
  task_status_changed: { icon: '🔄', color: '#f59e0b' },
  task_completed: { icon: '✅', color: '#22c55e' },
  agent_joined: { icon: '🎉', color: '#ec4899' },
  agent_status_changed: { icon: '🔔', color: '#8b5cf6' },
  system: { icon: '⚙️', color: '#6b7280' },
};

export function ActivityPanel() {
  const { events } = useMissionStore();
  const [filter, setFilter] = useState<EventFilter>('all');

  const filtered = events.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'tasks') return e.type.startsWith('task_');
    if (filter === 'agents') return e.type.startsWith('agent_');
    return e.type === 'system';
  });

  // Group by date
  const grouped = filtered.reduce((acc, event) => {
    const date = format(new Date(event.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display flex items-center gap-2">
              <Activity className="w-6 h-6 text-accent" />
              Activity Timeline
            </h1>
            <p className="text-sm text-text-muted mt-1">{events.length} events</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          {(['all', 'tasks', 'agents', 'system'] as EventFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors ${
                filter === f
                  ? 'bg-accent/15 text-accent font-medium'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dateEvents]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 sticky top-0 bg-bg-deep/80 backdrop-blur-sm py-1">
                {format(new Date(date), 'EEEE, MMMM d')}
              </h3>
              <div className="space-y-1 ml-2 border-l-2 border-border-subtle/30 pl-4">
                {dateEvents.map((event) => {
                  const meta = eventMeta[event.type] || eventMeta.system;
                  return (
                    <div key={event.id} className="flex items-start gap-3 py-2 hover:bg-bg-surface/30 rounded-lg px-2 -ml-2 transition-colors">
                      <span className="text-sm mt-0.5 shrink-0">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">{event.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-text-muted">
                            {format(new Date(event.created_at), 'HH:mm:ss')}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                            style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                          >
                            {event.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No activity recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
