import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Sun } from 'lucide-react';
import { usePrivacyStore, maskAgentName } from '@/store/privacy';

interface AgentSummary {
  agent_id: string;
  agent_name: string;
  agent_emoji: string;
  summary: string;
  event_count: number;
  events: { id: string; message: string; created_at: string; type: string }[];
}

export function OvernightView() {
  const { demoMode } = usePrivacyStore();
  const [summaries, setSummaries] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/overnight')
      .then((r) => r.json())
      .then(setSummaries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">Loading overnight summary...</div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Sun className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Overnight Summary</h2>
      </div>
      {summaries.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">Nothing happened overnight — all quiet! 😴</div>
      ) : (
        <div className="space-y-3">
          {summaries.map((s) => (
            <div key={s.agent_id} className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
              <button
                onClick={() => toggle(s.agent_id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-bg-elevated/50 transition-colors text-left"
              >
                <span className="text-2xl">{s.agent_emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {demoMode ? maskAgentName(s.agent_name, true) : s.agent_name}
                    </span>
                    <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                      {s.event_count} events
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{s.summary}</p>
                </div>
                {expanded.has(s.agent_id) ? (
                  <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                )}
              </button>
              {expanded.has(s.agent_id) && (
                <div className="border-t border-border-subtle/50 px-4 py-2 space-y-1">
                  {s.events.map((e) => (
                    <div key={e.id} className="flex items-start gap-2 py-1.5 text-xs">
                      <span className="text-text-muted shrink-0">
                        {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-text-secondary">{e.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
