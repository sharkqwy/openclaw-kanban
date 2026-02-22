import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle, ArrowUpRight, TrendingUp, X, FolderOpen,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
interface LearningEntry {
  id: string;
  file: string;
  category: string;
  summary: string;
  status: string;
  priority: string;
  loggedDate: string;
}

interface LearningsStats {
  learnings: { total: number; pending: number; resolved: number; promoted: number };
  errors: { total: number; pending: number; resolved: number; promoted: number };
  features: { total: number; pending: number; resolved: number; promoted: number };
  lastUpdated: string;
}

// ─── Promote Modal ──────────────────────────────────────
function PromoteModal({ entry, onClose, onPromoted }: {
  entry: LearningEntry;
  onClose: () => void;
  onPromoted: () => void;
}) {
  const [targetFolder, setTargetFolder] = useState('concepts');
  const [title, setTitle] = useState(entry.summary.slice(0, 60).replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '-').toLowerCase());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePromote = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/knowledge/learnings/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: entry.file, entryId: entry.id, targetFolder, title }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to promote');
        return;
      }
      onPromoted();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-surface border border-border-subtle rounded-xl p-5 w-[380px] shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-text-primary">Promote to Second Brain</h3>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-secondary"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="text-[11px] text-text-muted mb-3">
          <span className="font-mono text-accent">{entry.id}</span> — {entry.summary.slice(0, 80)}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-1 block">Target Folder</label>
            <select
              value={targetFolder}
              onChange={(e) => setTargetFolder(e.target.value)}
              className="w-full px-3 py-1.5 bg-bg-deep border border-border-subtle rounded-lg text-[11px] text-text-primary focus:outline-none focus:border-accent/40"
            >
              <option value="concepts">concepts</option>
              <option value="decisions">decisions</option>
              <option value="projects">projects</option>
              <option value="journals">journals</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-1 block">Title (filename)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-bg-deep border border-border-subtle rounded-lg text-[11px] text-text-primary focus:outline-none focus:border-accent/40"
              placeholder="my-concept"
            />
          </div>
          {error && <div className="text-[11px] text-danger">{error}</div>}
          <button
            onClick={handlePromote}
            disabled={submitting || !title.trim()}
            className="w-full py-2 bg-accent text-bg-deep rounded-lg text-[12px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {submitting ? 'Promoting...' : 'Promote'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-warning/15 text-warning border-warning/20',
    resolved: 'bg-accent/15 text-accent border-accent/20',
    promoted: 'bg-info/15 text-info border-info/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border ${colors[status] || 'bg-bg-elevated text-text-muted border-border-subtle'}`}>
      {status}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    urgent: 'bg-danger',
    high: 'bg-warning',
    normal: 'bg-text-muted/40',
    low: 'bg-text-muted/20',
  };
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors[priority] || colors.normal}`} />;
}

// ─── Main Dashboard ─────────────────────────────────────
export function LearningsDashboard() {
  const [stats, setStats] = useState<LearningsStats | null>(null);
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [promoting, setPromoting] = useState<LearningEntry | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      const [statsRes, entriesRes] = await Promise.all([
        fetch('/api/knowledge/learnings/stats'),
        fetch('/api/knowledge/learnings/entries'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (entriesRes.ok) setEntries(await entriesRes.json());
    } catch { /* ignore */ }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount is a standard React pattern
  useEffect(() => { void loadData(); }, [loadData]);

  const filtered = filter === 'all' ? entries : entries.filter(e => e.status === filter);

  const totalPending = stats ? stats.learnings.pending + stats.errors.pending + stats.features.pending : 0;
  const totalResolved = stats ? stats.learnings.resolved + stats.errors.resolved + stats.features.resolved : 0;
  const totalPromoted = stats ? stats.learnings.promoted + stats.errors.promoted + stats.features.promoted : 0;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-4 h-4 text-accent" />
        <h2 className="text-[15px] font-semibold text-text-primary">Learnings Dashboard</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-bg-surface border border-warning/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-warning" />
            <span className="text-[10px] uppercase tracking-wider text-warning font-semibold">Pending</span>
          </div>
          <div className="text-[24px] font-bold text-warning">{totalPending}</div>
          {stats && (
            <div className="text-[9px] text-text-muted mt-1 space-x-2">
              <span>{stats.learnings.pending} learnings</span>
              <span>{stats.errors.pending} errors</span>
              <span>{stats.features.pending} features</span>
            </div>
          )}
        </div>
        <div className="bg-bg-surface border border-accent/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">Resolved</span>
          </div>
          <div className="text-[24px] font-bold text-accent">{totalResolved}</div>
        </div>
        <div className="bg-bg-surface border border-info/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-3.5 h-3.5 text-info" />
            <span className="text-[10px] uppercase tracking-wider text-info font-semibold">Promoted</span>
          </div>
          <div className="text-[24px] font-bold text-info">{totalPromoted}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-bg-deep/80 rounded-lg p-[3px] w-fit">
        {['all', 'pending', 'resolved', 'promoted'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-[4px] rounded-md text-[10px] font-medium transition-all ${
              filter === f ? 'bg-accent text-bg-deep' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Entry List */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <FolderOpen className="w-6 h-6 text-text-muted/20 mx-auto mb-2" />
          <p className="text-[12px] text-text-muted">
            {entries.length === 0 ? 'No learnings entries yet' : `No ${filter} entries`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-surface border border-border-subtle rounded-lg p-3 hover:border-accent/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityDot priority={entry.priority} />
                    <span className="text-[10px] font-mono text-accent/70">{entry.id}</span>
                    <StatusBadge status={entry.status} />
                    <span className="text-[9px] text-text-muted/50 px-1.5 py-0.5 bg-bg-deep rounded">
                      {entry.file.replace('.md', '')}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary truncate">{entry.summary}</p>
                  <div className="flex items-center gap-3 mt-1 text-[9px] text-text-muted">
                    {entry.category && <span>Category: {entry.category}</span>}
                    {entry.loggedDate && <span>{entry.loggedDate}</span>}
                  </div>
                </div>
                {entry.status === 'pending' && (
                  <button
                    onClick={() => setPromoting(entry)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent rounded-md text-[10px] font-medium hover:bg-accent/20 transition-colors"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    Promote
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Promote Modal */}
      <AnimatePresence>
        {promoting && (
          <PromoteModal
            entry={promoting}
            onClose={() => setPromoting(null)}
            onPromoted={() => { setPromoting(null); loadData(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
