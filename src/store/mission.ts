import { create } from 'zustand';
import type { Agent, Task, Event as MCEvent, TaskStatus } from '@/shared/types';

interface MissionState {
  // Data
  agents: Agent[];
  tasks: Task[];
  events: MCEvent[];

  // UI
  selectedTask: Task | null;
  isOnline: boolean;
  isLoading: boolean;

  // Actions
  setAgents: (agents: Agent[]) => void;
  setTasks: (tasks: Task[]) => void;
  setEvents: (events: MCEvent[]) => void;
  addEvent: (event: MCEvent) => void;
  setSelectedTask: (task: Task | null) => void;
  setIsOnline: (online: boolean) => void;
  setIsLoading: (loading: boolean) => void;

  // Task mutations
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTask: (task: Task) => void;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;

  // Agent mutations
  addAgent: (agent: Agent) => void;
  updateAgent: (agent: Agent) => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  agents: [],
  tasks: [],
  events: [],
  selectedTask: null,
  isOnline: false,
  isLoading: true,

  setAgents: (agents) => set({ agents }),
  setTasks: (tasks) => set({ tasks }),
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((s) => ({ events: [event, ...s.events].slice(0, 100) })),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setIsOnline: (online) => set({ isOnline: online }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  updateTaskStatus: (taskId, status) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) })),
  updateTask: (task) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === task.id ? task : t)) })),
  addTask: (task) =>
    set((s) => {
      if (s.tasks.some((t) => t.id === task.id)) return s;
      return { tasks: [task, ...s.tasks] };
    }),
  removeTask: (taskId) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) })),

  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (agent) =>
    set((s) => ({ agents: s.agents.map((a) => (a.id === agent.id ? agent : a)) })),
}));
