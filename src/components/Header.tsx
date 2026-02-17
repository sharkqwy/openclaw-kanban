import { useState } from 'react';
import { Plus, Lock, Unlock, LayoutDashboard, Clock, Timer, Sun } from 'lucide-react';
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

  const activeTasks = tasks.filter((t) => !['done', 'planning'].includes(t.status)).length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  return (
    <>
      <header className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-bg-surface/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
              N
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Nexus</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-accent animate-pulse' : 'bg-red-500'}`} />
            {isOnline ? 'Connected' : 'Offline'}
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-1 ml-4 bg-bg-deep rounded-lg p-0.5">
            {VIEW_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeView === tab.id
                      ? 'bg-accent text-bg-deep'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!demoMode && (
            <div className="flex gap-3 text-xs text-text-secondary">
              <span>Active: <strong className="text-accent">{activeTasks}</strong></span>
              <span>Done: <strong className="text-emerald-400">{doneTasks}</strong></span>
            </div>
          )}

          {/* Privacy toggle */}
          <button
            onClick={toggleDemoMode}
            className={`p-1.5 rounded-lg transition-colors ${
              demoMode ? 'bg-amber-500/20 text-amber-400' : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
            }`}
            title={demoMode ? 'Demo mode ON — click to disable' : 'Enable demo/privacy mode'}
          >
            {demoMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent text-bg-deep rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </header>

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
