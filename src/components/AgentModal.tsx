import { useState } from 'react';
import { X, Save, Trash2, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMissionStore } from '@/store';
import { usePrivacyStore } from '@/store/privacy';
import type { Agent } from '@/shared/types';

interface AgentModalProps {
  agent?: Agent;
  onClose: () => void;
  onAgentCreated?: (agentId: string) => void;
}

export function AgentModal({ agent, onClose, onAgentCreated }: AgentModalProps) {
  const { addAgent, updateAgent } = useMissionStore();
  const { demoMode } = usePrivacyStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: agent?.name || '',
    role: agent?.role || '',
    description: agent?.description || '',
    avatar_emoji: agent?.avatar_emoji || '🤖',
    is_master: agent?.is_master || 0,
    model: agent?.model || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = agent ? `/api/agents/${agent.id}` : '/api/agents';
      const method = agent ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const saved = await res.json();
        if (agent) updateAgent(saved);
        else {
          addAgent(saved);
          onAgentCreated?.(saved.id);
        }
        onClose();
      }
    } catch (err) {
      console.error('Failed to save agent:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!agent || !confirm(`Delete agent "${agent.name}"?`)) return;
    await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' });
    useMissionStore.setState((s) => ({
      agents: s.agents.filter((a) => a.id !== agent.id),
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-bg-surface border border-border-subtle rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold">{agent ? `Edit ${agent.name}` : 'Create Agent'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-bg-elevated rounded"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="flex gap-3">
            <div>
              <label className="text-[10px] uppercase text-text-secondary mb-1 block">Emoji</label>
              <input
                value={form.avatar_emoji}
                onChange={(e) => setForm({ ...form, avatar_emoji: e.target.value })}
                className="w-14 bg-bg-deep border border-border-subtle rounded-lg px-2 py-2 text-center text-xl focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase text-text-secondary mb-1 block">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                placeholder="Agent name"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase text-text-secondary mb-1 block">Role</label>
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
              className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              placeholder="e.g., Builder, Strategist, Designer"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase text-text-secondary mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase text-text-secondary mb-1 block">Model</label>
            <input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full bg-bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              placeholder="e.g., anthropic/claude-sonnet-4-20250514"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.is_master}
              onChange={(e) => setForm({ ...form, is_master: e.target.checked ? 1 : 0 })}
              className="rounded"
            />
            <span className="text-sm text-text-secondary">Master agent (orchestrator)</span>
          </label>

          {/* Per-agent cost breakdown (Phase 3) */}
          {agent && !demoMode && (
            <div className="mt-2 p-3 bg-bg-deep rounded-lg border border-border-subtle">
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-accent" />
                <span className="text-[10px] uppercase text-text-secondary font-semibold">Cost Breakdown</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-text-muted block">Today</span>
                  <span className="text-sm font-mono text-accent">$1.24</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">This Week</span>
                  <span className="text-sm font-mono text-accent">$8.67</span>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="flex items-center justify-between p-4 border-t border-border-subtle">
          {agent ? (
            <button onClick={handleDelete} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-bg-deep rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
