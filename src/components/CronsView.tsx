import { useEffect, useState } from 'react';
import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { usePrivacyStore, maskAgentName } from '@/store/privacy';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  last_run: string | null;
  next_run: string;
  status: 'ok' | 'error' | 'running' | 'idle';
  agent: string;
}

export function CronsView() {
  const [crons, setCrons] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { demoMode } = usePrivacyStore();

  useEffect(() => {
    fetch('/api/crons')
      .then((r) => r.json())
      .then(setCrons)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const trigger = async (id: string) => {
    try {
      await fetch(`/api/crons/${id}/trigger`, { method: 'POST' });
      setCrons((prev) => prev.map((c) => c.id === id ? { ...c, status: 'running' as const } : c));
    } catch (e) { console.error(e); }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'ok': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running': return <Clock className="w-4 h-4 text-accent animate-spin" />;
      default: return <Clock className="w-4 h-4 text-text-muted" />;
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">Loading crons...</div>;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4">Cron Jobs</h2>
      {crons.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">No cron jobs configured</div>
      ) : (
        <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-secondary">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Last Run</th>
                <th className="px-4 py-3">Next Run</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {crons.map((cron) => (
                <tr key={cron.id} className="border-b border-border-subtle/50 hover:bg-bg-elevated/50 transition-colors">
                  <td className="px-4 py-3">{statusIcon(cron.status)}</td>
                  <td className="px-4 py-3 font-medium">{demoMode ? `Cron #${cron.id.slice(0,3)}` : cron.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{cron.schedule}</td>
                  <td className="px-4 py-3 text-text-secondary">{demoMode ? maskAgentName(cron.agent, true) : cron.agent}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{cron.last_run || '—'}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{cron.next_run}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => trigger(cron.id)}
                      disabled={cron.status === 'running'}
                      className="p-1.5 rounded hover:bg-accent/20 text-accent disabled:opacity-30 transition-colors"
                      title="Trigger now"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
