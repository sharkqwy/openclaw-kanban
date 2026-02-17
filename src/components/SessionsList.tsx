import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Circle, Trash2, Check } from 'lucide-react';

interface Session {
  id: string;
  agent_id: string | null;
  openclaw_session_id: string;
  status: string;
  session_type: string;
  task_id: string | null;
  ended_at: string | null;
  created_at: string;
  agent_name?: string;
  agent_avatar_emoji?: string;
}

interface Props {
  taskId: string;
}

export function SessionsList({ taskId }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subagent`);
      if (res.ok) setSessions(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  const markComplete = async (sessionId: string) => {
    await fetch(`/api/openclaw/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', ended_at: new Date().toISOString() }),
    });
    load();
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this session?')) return;
    await fetch(`/api/openclaw/sessions/${sessionId}`, { method: 'DELETE' });
    load();
  };

  const formatDuration = (start: string, end?: string | null) => {
    const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m`;
    return `${Math.floor(ms / 1000)}s`;
  };

  if (loading) return <div className="text-center py-8 text-text-secondary text-sm">Loading sessions...</div>;

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-text-muted text-sm">
        <span className="text-3xl mb-2">🤖</span>
        <span>No sub-agent sessions yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div key={s.id} className="flex gap-3 p-3 bg-bg-deep rounded-lg border border-border-subtle">
          <div className="text-xl">{s.agent_avatar_emoji || '🤖'}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {s.status === 'active' ? (
                <Circle className="w-3.5 h-3.5 text-accent fill-accent animate-pulse" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 text-accent" />
              )}
              <span className="text-sm font-medium">{s.agent_name || 'Sub-Agent'}</span>
              <span className="text-[10px] text-text-muted capitalize">{s.status}</span>
            </div>
            <div className="text-[10px] text-text-muted font-mono truncate">{s.openclaw_session_id}</div>
            <div className="text-[10px] text-text-muted mt-1">Duration: {formatDuration(s.created_at, s.ended_at)}</div>
          </div>
          <div className="flex flex-col gap-1">
            {s.status === 'active' && (
              <button onClick={() => markComplete(s.openclaw_session_id)} className="p-1 hover:bg-bg-elevated rounded text-accent" title="Mark complete">
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => deleteSession(s.openclaw_session_id)} className="p-1 hover:bg-bg-elevated rounded text-red-400" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
