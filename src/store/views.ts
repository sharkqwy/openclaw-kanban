import { create } from 'zustand';

export type ViewTab = 'board' | 'timeline' | 'crons' | 'overnight';

interface ViewState {
  activeView: ViewTab;
  setActiveView: (view: ViewTab) => void;
  agentFilter: string | null;
  setAgentFilter: (id: string | null) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  activeView: 'board',
  setActiveView: (view) => set({ activeView: view }),
  agentFilter: null,
  setAgentFilter: (id) => set((s) => ({ agentFilter: s.agentFilter === id ? null : id })),
}));
