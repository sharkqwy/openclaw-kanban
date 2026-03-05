import { useState } from 'react';
import { Plus, Search, Bot, Pencil, Trash2, Monitor, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useMissionStore } from '@/store';
import type { Agent, AgentStatus } from '@/shared/types';
import { AgentModal } from './AgentModal';

type ViewMode = 'grid' | 'list';

function AgentDetailCard({ agent, onEdit, onDelete, taskCount }: {
  agent: Agent; onEdit: () => void; onDelete: () => void; taskCount: number
}) {
  const statusColor = agent.status === 'working' ? 'bg-accent' : agent.status === 'standby' ? 'bg-text-secondary' : 'bg-gray-600';
  const statusGlow = agent.status === 'working' ? 'shadow-accent/20 shadow-lg' : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-bg-surface border border-border-subtle rounded-xl p-5 hover:border-accent/20 transition-all group ${statusGlow}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative text-3xl">
            {agent.avatar_emoji}
            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-bg-surface ${statusColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              {agent.name}
              {!!agent.is_master && <span className="text-[10px] text-amber-400">★ Lead</span>}
            </h3>
            <p className="text-xs text-text-muted">{agent.role}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-accent transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {agent.description && (
        <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-2">{agent.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-bg-elevated/50 rounded-lg p-2 text-center">
          <p className="text-sm font-bold">{taskCount}</p>
          <p className="text-[9px] text-text-muted uppercase">Tasks</p>
        </div>
        <div className="bg-bg-elevated/50 rounded-lg p-2 text-center">
          <p className="text-sm font-bold capitalize">{agent.status}</p>
          <p className="text-[9px] text-text-muted uppercase">Status</p>
        </div>
        <div className="bg-bg-elevated/50 rounded-lg p-2 text-center">
          <p className="text-sm font-bold truncate">{agent.model || '—'}</p>
          <p className="text-[9px] text-text-muted uppercase">Model</p>
        </div>
      </div>

      {/* Soul indicator */}
      {agent.soul_md && (
        <div className="flex items-center gap-1.5 text-[10px] text-purple-400 bg-purple-500/10 rounded-lg px-2.5 py-1.5">
          <Brain className="w-3 h-3" />
          <span>Soul configured</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle/50">
        <span className="text-[10px] text-text-muted flex items-center gap-1">
          <Monitor className="w-3 h-3" />
          {agent.workspace_id}
        </span>
        <span className="text-[10px] text-text-muted">
          {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
        </span>
      </div>
    </motion.div>
  );
}

export function AgentsPanel() {
  const { agents, tasks, removeAgent: removeAgentFromStore } = useMissionStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [_viewMode, _setViewMode] = useState<ViewMode>('grid');

  const filtered = agents
    .filter((a) => statusFilter === 'all' || a.status === statusFilter)
    .filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.role.toLowerCase().includes(search.toLowerCase()));

  const getTaskCount = (agentId: string) => tasks.filter(t => t.assigned_agent_id === agentId).length;

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' });
      if (res.ok) removeAgentFromStore(agent.id);
    } catch (err) {
      console.error('Failed to delete agent:', err);
    }
  };

  const statusCounts = {
    all: agents.length,
    working: agents.filter(a => a.status === 'working').length,
    standby: agents.filter(a => a.status === 'standby').length,
    offline: agents.filter(a => a.status === 'offline').length,
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display flex items-center gap-2">
              <Bot className="w-6 h-6 text-accent" />
              Agent Squad
            </h1>
            <p className="text-sm text-text-muted mt-1">Manage your AI agent fleet</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-bg-deep rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Agent
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Status tabs */}
          <div className="flex gap-1 bg-bg-surface border border-border-subtle rounded-lg p-1">
            {(['all', 'working', 'standby', 'offline'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-accent/15 text-accent font-medium'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {status} <span className="text-text-muted ml-1">{statusCounts[status]}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/40"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((agent) => (
              <AgentDetailCard
                key={agent.id}
                agent={agent}
                taskCount={getTaskCount(agent.id)}
                onEdit={() => setEditAgent(agent)}
                onDelete={() => handleDelete(agent)}
              />
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{search ? 'No agents match your search' : 'No agents registered yet'}</p>
          </div>
        )}
      </div>

      {showCreate && <AgentModal onClose={() => setShowCreate(false)} />}
      {editAgent && <AgentModal agent={editAgent} onClose={() => setEditAgent(null)} />}
    </div>
  );
}
