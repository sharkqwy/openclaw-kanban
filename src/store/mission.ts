import { create } from 'zustand';
import type { Agent, Task, Event as MCEvent, TaskStatus, PanelId, Comment, DashboardMetrics } from '@/shared/types';

interface MissionState {
  // Data
  agents: Agent[];
  tasks: Task[];
  events: MCEvent[];
  comments: Record<string, Comment[]>; // taskId -> comments

  // Dashboard
  metrics: DashboardMetrics | null;

  // UI
  activePanel: PanelId;
  selectedTask: Task | null;
  isOnline: boolean;
  isLoading: boolean;
  showLiveFeed: boolean;

  // Actions
  setActivePanel: (panel: PanelId) => void;
  setAgents: (agents: Agent[]) => void;
  setTasks: (tasks: Task[]) => void;
  setEvents: (events: MCEvent[]) => void;
  addEvent: (event: MCEvent) => void;
  setSelectedTask: (task: Task | null) => void;
  setIsOnline: (online: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setMetrics: (metrics: DashboardMetrics) => void;
  toggleLiveFeed: () => void;

  // Task mutations
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTask: (task: Task) => void;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;

  // Agent mutations
  addAgent: (agent: Agent) => void;
  updateAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;

  // Comments
  setComments: (taskId: string, comments: Comment[]) => void;
  addComment: (taskId: string, comment: Comment) => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  agents: [],
  tasks: [],
  events: [],
  comments: {},
  metrics: null,
  activePanel: 'dashboard',
  selectedTask: null,
  isOnline: false,
  isLoading: true,
  showLiveFeed: true,

  setActivePanel: (panel) => set({ activePanel: panel }),
  setAgents: (agents) => set({ agents }),
  setTasks: (tasks) => set({ tasks }),
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((s) => ({ events: [event, ...s.events].slice(0, 100) })),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setIsOnline: (online) => set({ isOnline: online }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMetrics: (metrics) => set({ metrics }),
  toggleLiveFeed: () => set((s) => ({ showLiveFeed: !s.showLiveFeed })),

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
  removeAgent: (agentId) =>
    set((s) => ({ agents: s.agents.filter((a) => a.id !== agentId) })),

  setComments: (taskId, comments) =>
    set((s) => ({ comments: { ...s.comments, [taskId]: comments } })),
  addComment: (taskId, comment) =>
    set((s) => ({
      comments: { ...s.comments, [taskId]: [...(s.comments[taskId] || []), comment] },
    })),
}));
