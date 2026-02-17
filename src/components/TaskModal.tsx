import { useState } from 'react';
import { X, Save, Trash2, Activity, Package, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMissionStore } from '@/store';
import type { Task, TaskPriority, TaskStatus } from '@/shared/types';
import { ActivityLog } from './ActivityLog';
import { DeliverablesList } from './DeliverablesList';
import { SessionsList } from './SessionsList';

type TabType = 'overview' | 'activity' | 'deliverables' | 'sessions';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
}

const STATUSES: TaskStatus[] = ['planning', 'inbox', 'active', 'review', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

export function TaskModal({ task, onClose }: TaskModalProps) {
  const { agents, updateTask } = useMissionStore();
  const [tab, setTab] = useState<TabType>('overview');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    status: task.status,
    assigned_agent_id: task.assigned_agent_id || '',
    due_date: task.due_date || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          assigned_agent_id: form.assigned_agent_id || null,
          due_date: form.due_date || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        updateTask(updated);

        // Auto-dispatch if moved to active
        if (task.status !== 'active' && updated.status === 'active' && updated.assigned_agent_id) {
          fetch(`/api/tasks/${task.id}/dispatch`, { method: 'POST' }).catch(console.error);
        }
        onClose();
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    useMissionStore.setState((s) => ({ tasks: s.tasks.filter((t) => t.id !== task.id) }));
    onClose();
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'activity' as TabType, label: 'Activity', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'deliverables' as TabType, label: 'Deliverables', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'sessions' as TabType, label: 'Sessions', icon: <Bot className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-bg-surface border border-border-subtle rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle shrink-0">
          <h2 className="text-base font-semibold truncate pr-4">{task.title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-bg-elevated rounded"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                tab === t.id ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'overview' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase text-text-secondary mb-1 block">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-text-secondary mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-text-secondary mb-1 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                    className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-text-secondary mb-1 block">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                    className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase text-text-secondary mb-1 block">Assign to</label>
                <select
                  value={form.assigned_agent_id}
                  onChange={(e) => setForm({ ...form, assigned_agent_id: e.target.value })}
                  className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.avatar_emoji} {a.name} — {a.role}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-text-secondary mb-1 block">Due Date</label>
                <input
                  type="datetime-local"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          {tab === 'activity' && <ActivityLog taskId={task.id} />}
          {tab === 'deliverables' && <DeliverablesList taskId={task.id} />}
          {tab === 'sessions' && <SessionsList taskId={task.id} />}
        </div>

        {/* Footer */}
        {tab === 'overview' && (
          <div className="flex items-center justify-between p-4 border-t border-border-subtle shrink-0">
            <button onClick={handleDelete} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-3 py-1.5 text-sm text-text-secondary">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-bg-deep rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
