import { create } from 'zustand';

interface PrivacyState {
  demoMode: boolean;
  toggleDemoMode: () => void;
}

const stored = typeof window !== 'undefined' ? localStorage.getItem('nexus-demo-mode') === 'true' : false;

export const usePrivacyStore = create<PrivacyState>((set) => ({
  demoMode: stored,
  toggleDemoMode: () => set((s) => {
    const next = !s.demoMode;
    localStorage.setItem('nexus-demo-mode', String(next));
    return { demoMode: next };
  }),
}));

// Helper to mask data in demo mode
let agentCounter = 0;
const agentMap = new Map<string, string>();

export function maskAgentName(name: string, demoMode: boolean): string {
  if (!demoMode) return name;
  if (!agentMap.has(name)) {
    agentMap.set(name, `Agent ${String.fromCharCode(65 + agentCounter++)}`);
  }
  return agentMap.get(name)!;
}

let taskCounter = 0;
const taskMap = new Map<string, string>();

export function maskTaskTitle(id: string, demoMode: boolean): string {
  if (!demoMode) return '';
  if (!taskMap.has(id)) {
    taskMap.set(id, `Task #${String(++taskCounter).padStart(3, '0')}`);
  }
  return taskMap.get(id)!;
}
