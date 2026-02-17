import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Cpu, HardDrive, MemoryStick, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { useMissionStore } from '@/store';
import { useViewStore } from '@/store/views';
import { usePrivacyStore, maskAgentName } from '@/store/privacy';
import type { Agent, AgentStatus, SystemVitals } from '@/shared/types';
import { AgentModal } from './AgentModal';

type FilterTab = 'all' | 'working' | 'standby';

function DroppableAgent({ agent, onClick, statusColor, isFiltered, demoMode }: { agent: Agent; onClick: () => void; statusColor: (s: AgentStatus) => string; isFiltered?: boolean; demoMode?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `agent-drop-${agent.id}` });

  return (
    <motion.button
      ref={setNodeRef}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-bg-elevated transition-all text-left ${
        isOver ? 'bg-accent/20 border border-accent/40 ring-1 ring-accent/30' : isFiltered ? 'border border-accent/30 bg-accent/5' : 'border border-transparent'
      }`}
    >
      <div className="relative text-xl">
        {agent.avatar_emoji}
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg-surface ${statusColor(agent.status)}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{demoMode ? maskAgentName(agent.name, true) : agent.name}</span>
          {!!agent.is_master && <span className="text-[10px] text-amber-400">★</span>}
        </div>
        <span className="text-[10px] text-text-secondary truncate block">{agent.role}</span>
      </div>
      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${
        agent.status === 'working' ? 'bg-accent/20 text-accent' : 'bg-bg-elevated text-text-muted'
      }`}>
        {agent.status}
      </span>
    </motion.button>
  );
}

function VitalsBar({ label, percent, color, icon: Icon }: { label: string; percent: number; color: string; icon: any }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3 h-3 text-text-muted shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[9px] text-text-muted uppercase">{label}</span>
          <span className="text-[9px] text-text-secondary">{percent}%</span>
        </div>
        <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}

export function AgentsSidebar() {
  const { agents } = useMissionStore();
  const { agentFilter, setAgentFilter } = useViewStore();
  const { demoMode } = usePrivacyStore();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [vitals, setVitals] = useState<SystemVitals | null>(null);

  // Poll system vitals every 10s
  useEffect(() => {
    const fetchVitals = () => fetch('/api/system').then(r => r.json()).then(setVitals).catch(() => {});
    fetchVitals();
    const interval = setInterval(fetchVitals, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = agents.filter((a) => filter === 'all' || a.status === filter);
  const statusColor = (s: AgentStatus) =>
    s === 'working' ? 'bg-accent' : s === 'standby' ? 'bg-text-secondary' : 'bg-gray-600';

  const llmCost = process.env.LLM_DAILY_COST || '$—';

  if (minimized) {
    return (
      <aside className="w-12 bg-bg-surface border-r border-border-subtle flex flex-col items-center py-3 gap-3">
        <button onClick={() => setMinimized(false)} className="p-1 rounded hover:bg-bg-elevated text-text-secondary">
          <ChevronRight className="w-4 h-4" />
        </button>
        {agents.map((a) => (
          <button
            key={a.id}
            onClick={() => setEditAgent(a)}
            className="relative text-xl hover:scale-110 transition-transform"
            title={`${a.name} — ${a.role}`}
          >
            {a.avatar_emoji}
            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-bg-surface ${statusColor(a.status)}`} />
          </button>
        ))}
        {editAgent && <AgentModal agent={editAgent} onClose={() => setEditAgent(null)} />}
      </aside>
    );
  }

  return (
    <aside className="w-60 bg-bg-surface border-r border-border-subtle flex flex-col shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setMinimized(true)} className="p-1 rounded hover:bg-bg-elevated text-text-secondary">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Agents</span>
            <span className="text-[10px] bg-bg-elevated px-1.5 py-0.5 rounded text-text-secondary">{agents.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          {(['all', 'working', 'standby'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 text-[10px] rounded uppercase tracking-wider transition-colors ${
                filter === tab ? 'bg-accent text-bg-deep font-bold' : 'text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence>
          {filtered.map((agent) => (
            <DroppableAgent
              key={agent.id}
              agent={agent}
              onClick={() => {
                // Right-click or ctrl-click for filtering; normal click opens modal
                setAgentFilter(agent.id);
                setEditAgent(agent);
              }}
              statusColor={statusColor}
              isFiltered={agentFilter === agent.id}
              demoMode={demoMode}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add button */}
      <div className="p-2 border-t border-border-subtle">
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-bg-elevated hover:bg-border-subtle rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Agent
        </button>
      </div>

      {/* System Vitals Footer */}
      <div className="p-3 border-t border-border-subtle space-y-2">
        {vitals ? (
          <>
            <VitalsBar label="CPU" percent={vitals.cpu} color="#22c55e" icon={Cpu} />
            <VitalsBar label="RAM" percent={vitals.memory.percent} color="#3b82f6" icon={MemoryStick} />
            <VitalsBar label="Disk" percent={vitals.disk.percent} color="#f59e0b" icon={HardDrive} />
          </>
        ) : (
          <div className="text-[9px] text-text-muted text-center">Loading vitals...</div>
        )}
        {/* LLM Fuel Gauges */}
        <div className="pt-1 border-t border-border-subtle/50 space-y-1.5">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-text-muted shrink-0" />
            <span className="text-[9px] text-text-muted uppercase">LLM Usage</span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-text-secondary">Claude Opus</span>
              <span className="text-[9px] text-text-muted">{demoMode ? '—' : '67%'}</span>
            </div>
            <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-purple-500 transition-all duration-500" style={{ width: demoMode ? '0%' : '67%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-text-secondary">Claude Sonnet</span>
              <span className="text-[9px] text-text-muted">{demoMode ? '—' : '34%'}</span>
            </div>
            <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: demoMode ? '0%' : '34%' }} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50">
          <span className="text-[9px] text-text-muted uppercase">LLM Cost/day</span>
          <span className="text-[10px] font-mono text-accent">{demoMode ? '$—' : llmCost}</span>
        </div>
      </div>

      {showCreate && <AgentModal onClose={() => setShowCreate(false)} />}
      {editAgent && <AgentModal agent={editAgent} onClose={() => setEditAgent(null)} />}
    </aside>
  );
}
