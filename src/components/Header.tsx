import { useState } from 'react';
import { Plus, Lock, Unlock, LayoutDashboard, Clock, Timer, Sun, Keyboard } from 'lucide-react';
import { useMissionStore } from '@/store';
import { useViewStore, type ViewTab } from '@/store/views';
import { usePrivacyStore } from '@/store/privacy';
import { CreateTaskModal } from './CreateTaskModal';

const VIEW_TABS: { id: ViewTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'board', label: 'Board', icon: LayoutDashboard },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'crons', label: 'Crons', icon: Timer },
  { id: 'overnight', label: 'Overnight', icon: Sun },
];

export function Header() {
  const { isOnline, tasks } = useMissionStore();
  const { activeView, setActiveView } = useViewStore();
  const { demoMode, toggleDemoMode } = usePrivacyStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const activeTasks = tasks.filter((t) => !['done', 'planning'].includes(t.status)).length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  return (
    <>
      <header className="flex items-center justify-between px-5 h-12 border-b border-border-subtle bg-bg-surface/60 backdrop-blur-md shrink-0">
        {/* Left: Logo + Status + Tabs */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
              <span className="text-accent font-bold text-[13px] tracking-tight">N</span>
            </div>
            <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-text-primary">Nexus</h1>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <span className={`w-[6px] h-[6px] rounded-full ${isOnline ? 'bg-accent animate-pulse-glow' : 'bg-danger'}`} />
            <span>{isOnline ? 'Connected' : 'Offline'}</span>
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-0.5 ml-2 bg-bg-deep/80 rounded-lg p-[3px]">
            {VIEW_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-[5px] rounded-md text-[11px] font-medium transition-all duration-200 ${
                    activeView === tab.id
                      ? 'bg-accent text-bg-deep shadow-sm'
                      : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated/50'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Stats + Actions */}
        <div className="flex items-center gap-3">
          {!demoMode && (
            <div className="flex gap-3 text-[11px] text-text-muted">
              <span>Active <strong className="text-accent font-semibold">{activeTasks}</strong></span>
              <span>Done <strong className="text-accent/70 font-semibold">{doneTasks}</strong></span>
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors"
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          {/* Privacy toggle */}
          <button
            onClick={toggleDemoMode}
            className={`p-1.5 rounded-lg transition-colors ${
              demoMode ? 'bg-warning/15 text-warning' : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
            }`}
            title={demoMode ? 'Demo mode ON — click to disable' : 'Enable demo/privacy mode'}
          >
            {demoMode ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-[6px] bg-accent text-bg-deep rounded-lg text-[12px] font-semibold hover:bg-accent-hover transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
        </div>
      </header>

      {/* Keyboard shortcuts popover */}
      {showShortcuts && (
        <div className="absolute top-12 right-4 z-50 bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-2xl min-w-[240px]">
          <div className="text-[11px] uppercase tracking-[0.06em] text-text-secondary font-semibold mb-3">Keyboard Shortcuts</div>
          <div className="space-y-2 text-[12px]">
            {[
              ['N', 'New task'],
              ['1-4', 'Switch view'],
              ['/', 'Focus search'],
              ['Esc', 'Close modal'],
              ['P', 'Toggle privacy'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-text-muted">{desc}</span>
                <kbd className="px-1.5 py-0.5 bg-bg-deep rounded text-[10px] font-mono text-text-secondary border border-border-subtle">{key}</kbd>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowShortcuts(false)}
            className="mt-3 w-full text-center text-[10px] text-text-muted hover:text-text-secondary"
          >
            Click anywhere to close
          </button>
        </div>
      )}

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </>
  );
}