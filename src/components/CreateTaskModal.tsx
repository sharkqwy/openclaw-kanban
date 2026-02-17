import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMissionStore } from '@/store';
import type { TaskPriority, TaskStatus } from '@/shared/types';

interface CreateTaskModalProps {
  onClose: () => void;
}

const STATUSES: TaskStatus[] = ['planning', 'inbox', 'assigned', 'in_progress', 'testing', 'review', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

export function CreateTaskModal({ onClose }: CreateTaskModalProps) {
  const { agents, addTask } = useMissionStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'normal' as TaskPriority,
    status: 'inbox' as TaskStatus,
    assigned_agent_id: '',
    due_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          assigned_agent_id: form.assigned_agent_id || null,
          due_date: form.due_date || null,
        }),
      });
      if (res.ok) {
        const task = await res.json();
        addTask(task);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-bg-surface border border-border-subtle rounded-xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold">Create New Task</h2>
          <button onClick={onClose} className="p-1 hover:bg-bg-elevated rounded"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-[10px] uppercase text-text-secondary mb-1 block">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] uppercase text-text-secondary mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
              placeholder="Add details..."
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
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-text-secondary mb-1 block">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
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
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.avatar_emoji} {a.name} — {a.role}</option>
              ))}
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
        </form>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border-subtle">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-bg-deep rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
