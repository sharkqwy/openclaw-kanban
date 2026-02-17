import { describe, it, expect, beforeEach } from 'vitest';
import { useMissionStore } from './mission';
import type { Task, Agent } from '@/shared/types';

const mockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Test Task',
  status: 'inbox',
  priority: 'normal',
  assigned_agent_id: null,
  created_by_agent_id: null,
  workspace_id: 'default',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const mockAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: 'agent-1',
  name: 'Marcus',
  role: 'Builder',
  avatar_emoji: '🦾',
  status: 'standby',
  is_master: 1,
  workspace_id: 'default',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('useMissionStore', () => {
  beforeEach(() => {
    useMissionStore.setState({
      tasks: [],
      agents: [],
      events: [],
      selectedTask: null,
      isOnline: false,
      isLoading: true,
    });
  });

  describe('tasks', () => {
    it('adds a task', () => {
      const task = mockTask();
      useMissionStore.getState().addTask(task);
      expect(useMissionStore.getState().tasks).toHaveLength(1);
      expect(useMissionStore.getState().tasks[0].id).toBe('task-1');
    });

    it('deduplicates tasks', () => {
      const task = mockTask();
      useMissionStore.getState().addTask(task);
      useMissionStore.getState().addTask(task);
      expect(useMissionStore.getState().tasks).toHaveLength(1);
    });

    it('updates task status', () => {
      useMissionStore.getState().addTask(mockTask());
      useMissionStore.getState().updateTaskStatus('task-1', 'in_progress');
      expect(useMissionStore.getState().tasks[0].status).toBe('in_progress');
    });

    it('updates a task', () => {
      useMissionStore.getState().addTask(mockTask());
      useMissionStore.getState().updateTask(mockTask({ title: 'Updated' }));
      expect(useMissionStore.getState().tasks[0].title).toBe('Updated');
    });

    it('removes a task', () => {
      useMissionStore.getState().addTask(mockTask());
      useMissionStore.getState().removeTask('task-1');
      expect(useMissionStore.getState().tasks).toHaveLength(0);
    });
  });

  describe('agents', () => {
    it('adds an agent', () => {
      useMissionStore.getState().addAgent(mockAgent());
      expect(useMissionStore.getState().agents).toHaveLength(1);
    });

    it('updates an agent', () => {
      useMissionStore.getState().addAgent(mockAgent());
      useMissionStore.getState().updateAgent(mockAgent({ name: 'Updated' }));
      expect(useMissionStore.getState().agents[0].name).toBe('Updated');
    });
  });

  describe('events', () => {
    it('adds events and caps at 100', () => {
      const store = useMissionStore.getState();
      for (let i = 0; i < 110; i++) {
        store.addEvent({
          id: `evt-${i}`,
          type: 'task_created',
          message: `Event ${i}`,
          created_at: new Date().toISOString(),
        });
      }
      expect(useMissionStore.getState().events).toHaveLength(100);
      expect(useMissionStore.getState().events[0].id).toBe('evt-109');
    });
  });

  describe('UI state', () => {
    it('sets selected task', () => {
      const task = mockTask();
      useMissionStore.getState().setSelectedTask(task);
      expect(useMissionStore.getState().selectedTask?.id).toBe('task-1');
    });

    it('sets online status', () => {
      useMissionStore.getState().setIsOnline(true);
      expect(useMissionStore.getState().isOnline).toBe(true);
    });
  });
});
