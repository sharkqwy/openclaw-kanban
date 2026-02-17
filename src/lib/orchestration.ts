/**
 * Orchestration Helper
 * Functions for agents to log activities, deliverables, and manage sub-agent sessions.
 * Call these from agent code to update Mission Control in real-time.
 */

const BASE_URL = typeof window !== 'undefined' ? '' : (process.env.MISSION_CONTROL_URL || 'http://localhost:18790');

export interface LogActivityParams {
  taskId: string;
  activityType: 'spawned' | 'updated' | 'completed' | 'file_created' | 'status_changed';
  message: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

export interface LogDeliverableParams {
  taskId: string;
  deliverableType: 'file' | 'url' | 'artifact';
  title: string;
  path?: string;
  description?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/tasks/${params.taskId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: params.activityType,
        message: params.message,
        agent_id: params.agentId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      }),
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

export async function logDeliverable(params: LogDeliverableParams): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/tasks/${params.taskId}/deliverables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliverable_type: params.deliverableType,
        title: params.title,
        path: params.path,
        description: params.description,
      }),
    });
  } catch (err) {
    console.error('Failed to log deliverable:', err);
  }
}

export async function registerSubAgent(params: {
  taskId: string;
  sessionId: string;
  agentName?: string;
}): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/tasks/${params.taskId}/subagent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openclaw_session_id: params.sessionId,
        agent_name: params.agentName,
      }),
    });
  } catch (err) {
    console.error('Failed to register sub-agent:', err);
  }
}

export async function completeSubAgent(sessionId: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/openclaw/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', ended_at: new Date().toISOString() }),
    });
  } catch (err) {
    console.error('Failed to complete sub-agent:', err);
  }
}

/** Convenience: log spawn + register in one call */
export async function onSubAgentSpawned(params: {
  taskId: string;
  sessionId: string;
  agentName: string;
  description?: string;
}): Promise<void> {
  await Promise.all([
    logActivity({
      taskId: params.taskId,
      activityType: 'spawned',
      message: `Sub-agent spawned: ${params.agentName}`,
      metadata: { sessionId: params.sessionId, description: params.description },
    }),
    registerSubAgent(params),
  ]);
}

/** Convenience: log completion + mark session complete + log deliverables */
export async function onSubAgentCompleted(params: {
  taskId: string;
  sessionId: string;
  agentName: string;
  summary: string;
  deliverables?: Array<{ type: 'file' | 'url' | 'artifact'; title: string; path?: string }>;
}): Promise<void> {
  const promises: Promise<void>[] = [
    logActivity({
      taskId: params.taskId,
      activityType: 'completed',
      message: `${params.agentName} completed: ${params.summary}`,
      metadata: { sessionId: params.sessionId },
    }),
    completeSubAgent(params.sessionId),
  ];

  if (params.deliverables) {
    for (const d of params.deliverables) {
      promises.push(logDeliverable({ taskId: params.taskId, deliverableType: d.type, title: d.title, path: d.path }));
    }
  }

  await Promise.all(promises);
}

export function shouldAutoDispatch(prevStatus: string | undefined, newStatus: string, assignedAgentId: string | null): boolean {
  return prevStatus !== 'in_progress' && newStatus === 'in_progress' && !!assignedAgentId;
}
