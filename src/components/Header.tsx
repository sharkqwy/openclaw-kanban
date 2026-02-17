import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMissionStore } from '@/store';
import { CreateTaskModal } from './CreateTaskModal';

export function Header() {
  const { isOnline, tasks } = useMissionStore();
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
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-3 text-xs text-text-secondary">
            <span>Active: <strong className="text-accent">{activeTasks}</strong></span>
            <span>Done: <strong className="text-emerald-400">{doneTasks}</strong></span>
          </div>
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
