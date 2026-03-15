import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useMissionStore } from '@/store';
import { useViewStore } from '@/store/views';
import { usePrivacyStore, maskAgentName } from '@/store/privacy';
import type { Event as MCEvent } from '@/shared/types';

const eventIcons: Record<string, string> = {
  task_created: '📋', task_assigned: '👤', task_status_changed: '🔄',
  task_completed: '✅', agent_joined: '🎉', agent_status_changed: '🔔', system: '⚙️',
};

export function TimelineView() {
  const { agents } = useMissionStore();
  const { agentFilter } = useViewStore();
  const { demoMode } = usePrivacyStore();
  const [events, setEvents] = useState<MCEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events?limit=200')
      .then((r) => r.json())
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = agentFilter
    ? events.filter((e) => e.agent_id === agentFilter)
    : events;

  const getAgent = (id?: string) => agents.find((a) => a.id === id);

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">Loading timeline...</div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4">Timeline</h2>
      {agentFilter && (
        <div className="mb-3 text-xs text-accent">
          Filtering by: {getAgent(agentFilter)?.avatar_emoji} {demoMode ? maskAgentName(getAgent(agentFilter)?.name || '', true) : getAgent(agentFilter)?.name}
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">No events yet</div>
      ) : (
        <div className="space-y-1">
          {filtered.map((event) => {
            const agent = getAgent(event.agent_id);
            return (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-surface transition-colors">
                <span className="text-lg shrink-0">{agent?.avatar_emoji || eventIcons[event.type] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{event.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {agent && (
                      <span className="text-[10px] text-text-secondary">
                        {demoMode ? maskAgentName(agent.name, true) : agent.name}
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
