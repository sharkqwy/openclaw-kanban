import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2, Clock, AlertTriangle, Zap, Bot, Cpu, HardDrive, MemoryStick,
  TrendingUp, ListTodo, Users
} from 'lucide-react';
import { useMissionStore } from '@/store';
import type { SystemVitals, TaskStatus, TaskPriority } from '@/shared/types';

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: typeof CheckCircle2; color: string; sub?: string
}) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 hover:border-accent/20 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</p>
          {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function VitalGauge({ label, percent, color, icon: Icon }: {
  label: string; percent: number; color: string; icon: typeof Cpu
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-text-muted shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">{label}</span>
          <span className="text-xs font-mono text-text-secondary">{percent}%</span>
        </div>
        <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${percent}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: { name: string; role: string; avatar_emoji: string; status: string; model?: string } }) {
  const statusColor = agent.status === 'working' ? 'bg-accent' : agent.status === 'standby' ? 'bg-text-secondary' : 'bg-gray-600';
  return (
    <div className="flex items-center gap-3 p-3 bg-bg-elevated/50 rounded-lg hover:bg-bg-elevated transition-colors">
      <div className="relative text-2xl">
        {agent.avatar_emoji}
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-surface ${statusColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{agent.name}</p>
        <p className="text-xs text-text-muted truncate">{agent.role}</p>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-medium ${
        agent.status === 'working' ? 'bg-accent/15 text-accent' : 'bg-bg-surface text-text-muted'
      }`}>
        {agent.status}
      </span>
    </div>
  );
}

export function Dashboard() {
  const { tasks, agents, events, setActivePanel } = useMissionStore();
  const [vitals, setVitals] = useState<SystemVitals | null>(null);

  useEffect(() => {
    const fetchVitals = () => fetch('/api/system').then(r => r.json()).then(setVitals).catch(() => {});
    fetchVitals();
    const interval = setInterval(fetchVitals, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute metrics
  const byStatus = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const byPriority = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {} as Record<TaskPriority, number>);

  const activeTasks = (byStatus.active || 0) + (byStatus.review || 0);
  const doneTasks = byStatus.done || 0;
  const urgentTasks = (byPriority.urgent || 0) + (byPriority.high || 0);
  const epicCount = tasks.filter(t => t.is_epic).length;
  const workingAgents = agents.filter(a => a.status === 'working').length;

  const recentEvents = events.slice(0, 8);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">Mission Control</h1>
          <p className="text-sm text-text-muted mt-1">System overview and operational status</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Tasks" value={activeTasks} icon={Zap} color="#22c55e" sub={`${doneTasks} completed`} />
          <StatCard label="Total Tasks" value={tasks.length} icon={ListTodo} color="#3b82f6" sub={`${epicCount} EPICs`} />
          <StatCard label="Agents" value={agents.length} icon={Users} color="#a855f7" sub={`${workingAgents} working`} />
          <StatCard label="Urgent" value={urgentTasks} icon={AlertTriangle} color={urgentTasks > 0 ? '#ef4444' : '#5a6480'} sub="high + urgent priority" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Vitals */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> System Vitals
            </h2>
            {vitals ? (
              <div className="space-y-4">
                <VitalGauge label="CPU" percent={vitals.cpu} color="#22c55e" icon={Cpu} />
                <VitalGauge label="Memory" percent={vitals.memory.percent} color="#3b82f6" icon={MemoryStick} />
                <VitalGauge label="Disk" percent={vitals.disk.percent} color="#f59e0b" icon={HardDrive} />
                <div className="pt-3 border-t border-border-subtle/50 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Uptime</span>
                  <span className="text-xs font-mono text-text-secondary">
                    {Math.floor(vitals.uptime / 3600)}h {Math.floor((vitals.uptime % 3600) / 60)}m
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-text-muted animate-pulse">Loading vitals...</div>
            )}
          </div>

          {/* Task Breakdown */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Task Pipeline
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Planning', count: byStatus.planning || 0, color: '#a855f7', emoji: '📋' },
                { label: 'Inbox', count: byStatus.inbox || 0, color: '#ec4899', emoji: '📥' },
                { label: 'Active', count: byStatus.active || 0, color: '#22c55e', emoji: '⚡' },
                { label: 'Review', count: byStatus.review || 0, color: '#8b5cf6', emoji: '👁️' },
                { label: 'Done', count: byStatus.done || 0, color: '#10b981', emoji: '✅' },
              ].map(({ label, count, color, emoji }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm w-5 text-center">{emoji}</span>
                  <span className="text-xs text-text-secondary w-16">{label}</span>
                  <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: tasks.length ? `${(count / tasks.length) * 100}%` : '0%',
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-text-muted w-6 text-right">{count}</span>
                </div>
              ))}
            </div>

            {/* Priority breakdown */}
            <div className="mt-5 pt-4 border-t border-border-subtle/50">
              <h3 className="text-[10px] uppercase tracking-wider text-text-muted mb-2">By Priority</h3>
              <div className="flex gap-2">
                {[
                  { label: 'Urgent', count: byPriority.urgent || 0, color: 'bg-red-500' },
                  { label: 'High', count: byPriority.high || 0, color: 'bg-amber-400' },
                  { label: 'Normal', count: byPriority.normal || 0, color: 'bg-accent' },
                  { label: 'Low', count: byPriority.low || 0, color: 'bg-text-secondary/40' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex-1 text-center">
                    <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${color}`} />
                    <p className="text-sm font-bold">{count}</p>
                    <p className="text-[9px] text-text-muted">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Activity
            </h2>
            <div className="space-y-2">
              {recentEvents.length === 0 ? (
                <p className="text-xs text-text-muted py-4 text-center">No events yet</p>
              ) : (
                recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-2 py-1.5">
                    <span className="text-xs mt-0.5">
                      {event.type === 'task_completed' ? '✅' : event.type.startsWith('task_') ? '📋' : event.type.startsWith('agent_') ? '🤖' : '⚙️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed line-clamp-2">{event.message}</p>
                      <span className="text-[10px] text-text-muted">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {events.length > 8 && (
              <button
                onClick={() => setActivePanel('activity')}
                className="w-full mt-3 py-2 text-xs text-accent hover:bg-accent/5 rounded-lg transition-colors"
              >
                View all activity →
              </button>
            )}
          </div>
        </div>

        {/* Agent Squad */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <Bot className="w-4 h-4" /> Agent Squad
            </h2>
            <button
              onClick={() => setActivePanel('agents')}
              className="text-xs text-accent hover:underline"
            >
              Manage →
            </button>
          </div>
          {agents.length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">No agents registered</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
