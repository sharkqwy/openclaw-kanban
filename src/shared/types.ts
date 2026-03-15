// Core types for Mission Control v4

export type AgentStatus = 'standby' | 'working' | 'offline';
export type TaskStatus = 'planning' | 'inbox' | 'active' | 'review' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ActivityType = 'spawned' | 'updated' | 'completed' | 'file_created' | 'status_changed' | 'comment';
export type DeliverableType = 'file' | 'url' | 'artifact';
export type EventType = 'task_created' | 'task_assigned' | 'task_status_changed' | 'task_completed' | 'agent_status_changed' | 'agent_joined' | 'system';

// Navigation
export type PanelId = 'dashboard' | 'board' | 'agents' | 'activity';

export interface Comment {
  id: string;
  task_id: string;
  agent_id?: string;
  author_name: string;
  content: string;
  created_at: string;
  agent?: Agent;
}

export interface DashboardMetrics {
  tasks: { total: number; by_status: Record<TaskStatus, number>; by_priority: Record<TaskPriority, number> };
  agents: { total: number; working: number; standby: number; offline: number };
  recent_completions: number;
  epics: { total: number; in_progress: number; completed: number };
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description?: string;
  avatar_emoji: string;
  status: AgentStatus;
  is_master: number;
  workspace_id: string;
  soul_md?: string;
  user_md?: string;
  agents_md?: string;
  model?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_agent_id: string | null;
  created_by_agent_id: string | null;
  workspace_id: string;
  due_date?: string;
  // Phase 1 additions
  parent_task_id?: string | null;
  definition_of_done?: string | null;
  tags?: string | null; // JSON array string
  is_epic?: number;
  review_feedback?: string | null;
  task_order?: number;
  // Planning fields
  planning_session_key?: string;
  planning_messages?: string;
  planning_complete?: number;
  planning_spec?: string;
  planning_agents?: string;
  planning_dispatch_error?: string;
  created_at: string;
  updated_at: string;
  // Joined
  assigned_agent?: Agent;
  // Computed for EPICs
  child_tasks?: Task[];
  child_progress?: { total: number; done: number };
}

export interface Event {
  id: string;
  type: EventType;
  agent_id?: string;
  task_id?: string;
  message: string;
  metadata?: string;
  created_at: string;
  agent?: Agent;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  agent_id?: string;
  activity_type: ActivityType;
  message: string;
  metadata?: string;
  created_at: string;
  agent?: Agent;
}

export interface TaskDeliverable {
  id: string;
  task_id: string;
  deliverable_type: DeliverableType;
  title: string;
  path?: string;
  description?: string;
  created_at: string;
}

export interface OpenClawSession {
  id: string;
  agent_id: string;
  openclaw_session_id: string;
  channel?: string;
  status: string;
  session_type: string;
  task_id?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemVitals {
  cpu: number;       // percentage 0-100
  memory: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
  uptime: number;    // seconds
}

// SSE event types
export type SSEEventType = 'task_updated' | 'task_created' | 'task_deleted' | 'activity_logged' | 'deliverable_added' | 'agent_spawned' | 'agent_completed';

export interface SSEEvent {
  type: SSEEventType;
  payload: unknown;
}

// Column config for the board — 5 streamlined columns
export const TASK_COLUMNS: { id: TaskStatus; label: string; emoji: string; color: string }[] = [
  { id: 'planning', label: 'Planning', emoji: '📋', color: '#a855f7' },
  { id: 'inbox', label: 'Inbox', emoji: '📥', color: '#ec4899' },
  { id: 'active', label: 'Active', emoji: '⚡', color: '#22c55e' },
  { id: 'review', label: 'Review', emoji: '👁️', color: '#8b5cf6' },
  { id: 'done', label: 'Done', emoji: '✅', color: '#10b981' },
];

// Navigation panels
export const PANELS: { id: PanelId; label: string; emoji: string }[] = [
  { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { id: 'board', label: 'Board', emoji: '📋' },
  { id: 'agents', label: 'Agents', emoji: '🤖' },
  { id: 'activity', label: 'Activity', emoji: '📡' },
];
