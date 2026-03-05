import { LayoutDashboard, Columns3, Bot, Activity, Radio } from 'lucide-react';
import { useMissionStore } from '@/store';
import type { PanelId } from '@/shared/types';

const NAV_ITEMS: { id: PanelId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'board', label: 'Board', icon: Columns3 },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'activity', label: 'Activity', icon: Activity },
];

export function NavRail() {
  const { activePanel, setActivePanel, isOnline, showLiveFeed, toggleLiveFeed } = useMissionStore();

  return (
    <nav className="w-16 bg-bg-surface border-r border-border-subtle flex flex-col items-center py-4 shrink-0">
      {/* Logo */}
      <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-bold text-sm mb-6 select-none">
        MC
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col items-center gap-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            title={label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
              activePanel === id
                ? 'bg-accent/15 text-accent shadow-sm shadow-accent/10'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-2">
        {/* Live Feed Toggle */}
        <button
          onClick={toggleLiveFeed}
          title={showLiveFeed ? 'Hide Feed' : 'Show Feed'}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            showLiveFeed ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
          }`}
        >
          <Radio className="w-5 h-5" />
        </button>

        {/* Connection status */}
        <div className="flex flex-col items-center gap-1">
          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-accent animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[8px] text-text-muted uppercase">{isOnline ? 'Live' : 'Off'}</span>
        </div>
      </div>
    </nav>
  );
}
