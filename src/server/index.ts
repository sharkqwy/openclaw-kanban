/**
 * Mission Control API Server (Hono + better-sqlite3)
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { v4 as uuid } from 'uuid';
import { getDb, queryAll, queryOne, run } from './db/index.js';
import { addClient, broadcast } from './sse.js';
import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import type { Task, Agent, TaskActivity, TaskDeliverable, Event as MCEvent } from '../shared/types.js';

const app = new Hono();

app.use('*', cors());

// ─── Health ──────────────────────────────────────────────
app.get('/api/status', (c) => {
  return c.json({ ok: true, version: '2.0.0' });
});

// ─── Tasks CRUD ──────────────────────────────────────────
app.get('/api/tasks', (c) => {
  const workspace = c.req.query('workspace_id');
  let sql = `SELECT t.*, a.name as agent_name, a.avatar_emoji as agent_emoji, a.role as agent_role
    FROM tasks t LEFT JOIN agents a ON t.assigned_agent_id = a.id`;
  const params: string[] = [];
  if (workspace) { sql += ' WHERE t.workspace_id = ?'; params.push(workspace); }
  sql += ' ORDER BY t.updated_at DESC';
  const tasks = queryAll<any>(sql, params).map(enrichTask);
  return c.json(tasks);
});

app.post('/api/tasks', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const now = new Date().toISOString();
  run(
    `INSERT INTO tasks (id, title, description, status, priority, assigned_agent_id, created_by_agent_id, workspace_id, due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, body.title, body.description || null, body.status || 'inbox', body.priority || 'normal',
     body.assigned_agent_id || null, body.created_by_agent_id || null, body.workspace_id || 'default',
     body.due_date || null, now, now]
  );
  const task = queryOne<any>(`SELECT t.*, a.name as agent_name, a.avatar_emoji as agent_emoji, a.role as agent_role
    FROM tasks t LEFT JOIN agents a ON t.assigned_agent_id = a.id WHERE t.id = ?`, [id]);
  const enriched = enrichTask(task);
  broadcast({ type: 'task_created', payload: enriched });
  return c.json(enriched, 201);
});

app.get('/api/tasks/:id', (c) => {
  const task = queryOne<any>(`SELECT t.*, a.name as agent_name, a.avatar_emoji as agent_emoji, a.role as agent_role
    FROM tasks t LEFT JOIN agents a ON t.assigned_agent_id = a.id WHERE t.id = ?`, [c.req.param('id')]);
  if (!task) return c.json({ error: 'Not found' }, 404);
  return c.json(enrichTask(task));
});

app.patch('/api/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const fields: string[] = [];
  const params: unknown[] = [];

  for (const key of ['title', 'description', 'status', 'priority', 'assigned_agent_id', 'due_date', 'planning_session_key', 'planning_messages', 'planning_complete', 'planning_spec', 'planning_agents', 'planning_dispatch_error']) {
    if (key in body) { fields.push(`${key} = ?`); params.push(body[key]); }
  }
  if (fields.length === 0) return c.json({ error: 'No fields' }, 400);

  fields.push('updated_at = ?'); params.push(new Date().toISOString());
  params.push(id);
  run(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);

  const task = queryOne<any>(`SELECT t.*, a.name as agent_name, a.avatar_emoji as agent_emoji, a.role as agent_role
    FROM tasks t LEFT JOIN agents a ON t.assigned_agent_id = a.id WHERE t.id = ?`, [id]);
  const enriched = enrichTask(task);
  broadcast({ type: 'task_updated', payload: enriched });
  return c.json(enriched);
});

app.delete('/api/tasks/:id', (c) => {
  const id = c.req.param('id');
  run('DELETE FROM tasks WHERE id = ?', [id]);
  broadcast({ type: 'task_deleted', payload: { id } });
  return c.json({ ok: true });
});

// ─── Task Activities ─────────────────────────────────────
app.get('/api/tasks/:id/activities', (c) => {
  const activities = queryAll<TaskActivity>(
    `SELECT ta.*, a.name as agent_name, a.avatar_emoji as agent_emoji
     FROM task_activities ta LEFT JOIN agents a ON ta.agent_id = a.id
     WHERE ta.task_id = ? ORDER BY ta.created_at DESC`, [c.req.param('id')]
  );
  return c.json(activities);
});

app.post('/api/tasks/:id/activities', async (c) => {
  const taskId = c.req.param('id');
  const body = await c.req.json();
  const id = uuid();
  run(
    `INSERT INTO task_activities (id, task_id, agent_id, activity_type, message, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, taskId, body.agent_id || null, body.activity_type, body.message, body.metadata || null, new Date().toISOString()]
  );
  const activity = queryOne<TaskActivity>('SELECT * FROM task_activities WHERE id = ?', [id]);
  broadcast({ type: 'activity_logged', payload: activity });
  return c.json(activity, 201);
});

// ─── Task Deliverables ───────────────────────────────────
app.get('/api/tasks/:id/deliverables', (c) => {
  const deliverables = queryAll<TaskDeliverable>(
    'SELECT * FROM task_deliverables WHERE task_id = ? ORDER BY created_at DESC', [c.req.param('id')]
  );
  return c.json(deliverables);
});

app.post('/api/tasks/:id/deliverables', async (c) => {
  const taskId = c.req.param('id');
  const body = await c.req.json();
  const id = uuid();
  run(
    `INSERT INTO task_deliverables (id, task_id, deliverable_type, title, path, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, taskId, body.deliverable_type, body.title, body.path || null, body.description || null, new Date().toISOString()]
  );
  const deliverable = queryOne<TaskDeliverable>('SELECT * FROM task_deliverables WHERE id = ?', [id]);
  broadcast({ type: 'deliverable_added', payload: deliverable });
  return c.json(deliverable, 201);
});

// ─── Sub-agent Sessions ──────────────────────────────────
app.get('/api/tasks/:id/subagent', (c) => {
  const sessions = queryAll(
    `SELECT s.*, a.name as agent_name, a.avatar_emoji as agent_avatar_emoji
     FROM openclaw_sessions s LEFT JOIN agents a ON s.agent_id = a.id
     WHERE s.task_id = ? ORDER BY s.created_at DESC`, [c.req.param('id')]
  );
  return c.json(sessions);
});

app.post('/api/tasks/:id/subagent', async (c) => {
  const taskId = c.req.param('id');
  const body = await c.req.json();
  const id = uuid();
  const now = new Date().toISOString();
  run(
    `INSERT INTO openclaw_sessions (id, agent_id, openclaw_session_id, task_id, session_type, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'subagent', 'active', ?, ?)`,
    [id, body.agent_id || null, body.openclaw_session_id, taskId, now, now]
  );
  broadcast({ type: 'agent_spawned', payload: { taskId, sessionId: body.openclaw_session_id, agentName: body.agent_name } });
  return c.json({ ok: true, id }, 201);
});

// ─── Agents CRUD ─────────────────────────────────────────
app.get('/api/agents', (c) => {
  const workspace = c.req.query('workspace_id');
  let sql = 'SELECT * FROM agents';
  const params: string[] = [];
  if (workspace) { sql += ' WHERE workspace_id = ?'; params.push(workspace); }
  sql += ' ORDER BY is_master DESC, name ASC';
  return c.json(queryAll<Agent>(sql, params));
});

app.post('/api/agents', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const now = new Date().toISOString();
  run(
    `INSERT INTO agents (id, name, role, description, avatar_emoji, status, is_master, workspace_id, soul_md, user_md, agents_md, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, body.name, body.role, body.description || null, body.avatar_emoji || '🤖', body.status || 'standby',
     body.is_master ? 1 : 0, body.workspace_id || 'default', body.soul_md || null, body.user_md || null,
     body.agents_md || null, body.model || null, now, now]
  );
  const agent = queryOne<Agent>('SELECT * FROM agents WHERE id = ?', [id]);
  return c.json(agent, 201);
});

app.patch('/api/agents/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const fields: string[] = [];
  const params: unknown[] = [];

  for (const key of ['name', 'role', 'description', 'avatar_emoji', 'status', 'is_master', 'soul_md', 'user_md', 'agents_md', 'model']) {
    if (key in body) { fields.push(`${key} = ?`); params.push(body[key]); }
  }
  if (fields.length === 0) return c.json({ error: 'No fields' }, 400);

  fields.push('updated_at = ?'); params.push(new Date().toISOString());
  params.push(id);
  run(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`, params);
  return c.json(queryOne<Agent>('SELECT * FROM agents WHERE id = ?', [id]));
});

app.delete('/api/agents/:id', (c) => {
  run('DELETE FROM agents WHERE id = ?', [c.req.param('id')]);
  return c.json({ ok: true });
});

// ─── Events ──────────────────────────────────────────────
app.get('/api/events', (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  return c.json(queryAll<MCEvent>('SELECT * FROM events ORDER BY created_at DESC LIMIT ?', [limit]));
});

app.post('/api/events', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  run(
    `INSERT INTO events (id, type, agent_id, task_id, message, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, body.type, body.agent_id || null, body.task_id || null, body.message, body.metadata || null, new Date().toISOString()]
  );
  return c.json({ ok: true, id }, 201);
});

// ─── SSE Stream ──────────────────────────────────────────
app.get('/api/events/stream', (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: string) => {
        try { controller.enqueue(encoder.encode(data)); } catch { /* closed */ }
      };

      // Send initial ping
      send(': connected\n\n');

      const remove = addClient(send);

      // Keep-alive every 30s
      const keepAlive = setInterval(() => send(': ping\n\n'), 30000);

      // Cleanup when client disconnects
      c.req.raw.signal.addEventListener('abort', () => {
        remove();
        clearInterval(keepAlive);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

// ─── OpenClaw Sessions ───────────────────────────────────
app.get('/api/openclaw/sessions', (c) => {
  const type = c.req.query('session_type');
  const status = c.req.query('status');
  let sql = 'SELECT * FROM openclaw_sessions WHERE 1=1';
  const params: string[] = [];
  if (type) { sql += ' AND session_type = ?'; params.push(type); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  return c.json(queryAll(sql, params));
});

app.patch('/api/openclaw/sessions/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const fields: string[] = [];
  const params: unknown[] = [];
  for (const key of ['status', 'ended_at']) {
    if (key in body) { fields.push(`${key} = ?`); params.push(body[key]); }
  }
  fields.push('updated_at = ?'); params.push(new Date().toISOString());
  params.push(id);
  // Try matching by id or openclaw_session_id
  run(`UPDATE openclaw_sessions SET ${fields.join(', ')} WHERE id = ? OR openclaw_session_id = ?`, [...params.slice(0, -1), id, id]);
  return c.json({ ok: true });
});

app.delete('/api/openclaw/sessions/:id', (c) => {
  const id = c.req.param('id');
  run('DELETE FROM openclaw_sessions WHERE id = ? OR openclaw_session_id = ?', [id, id]);
  return c.json({ ok: true });
});

// ─── Task Dispatch ───────────────────────────────────────
app.post('/api/tasks/:id/dispatch', async (c) => {
  const id = c.req.param('id');
  const task = queryOne<Task>('SELECT * FROM tasks WHERE id = ?', [id]);
  if (!task) return c.json({ error: 'Task not found' }, 404);
  if (!task.assigned_agent_id) return c.json({ error: 'No agent assigned' }, 400);

  // Move to in_progress
  run('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?', ['in_progress', new Date().toISOString(), id]);

  // Log activity
  const actId = uuid();
  run(
    `INSERT INTO task_activities (id, task_id, agent_id, activity_type, message, created_at)
     VALUES (?, ?, ?, 'status_changed', ?, ?)`,
    [actId, id, task.assigned_agent_id, `Task dispatched to agent`, new Date().toISOString()]
  );

  const updated = queryOne<any>(`SELECT t.*, a.name as agent_name, a.avatar_emoji as agent_emoji, a.role as agent_role
    FROM tasks t LEFT JOIN agents a ON t.assigned_agent_id = a.id WHERE t.id = ?`, [id]);
  broadcast({ type: 'task_updated', payload: enrichTask(updated) });
  return c.json({ ok: true, task: enrichTask(updated) });
});

// ─── KANBAN.md Sync (legacy) ─────────────────────────────
const KANBAN_PATH = process.env.KANBAN_FILE || resolve(process.cwd(), 'KANBAN.md');

app.get('/read', async (c) => {
  try {
    const content = await readFile(KANBAN_PATH, 'utf-8');
    return c.text(content);
  } catch (err: any) {
    if (err.code === 'ENOENT') return c.text('File not found', 404);
    throw err;
  }
});

app.post('/write', async (c) => {
  const content = await c.req.text();
  const dir = dirname(KANBAN_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  await writeFile(KANBAN_PATH, content, 'utf-8');
  return c.text('OK');
});

// ─── Helper ──────────────────────────────────────────────
function enrichTask(row: any): Task {
  if (!row) return row;
  const { agent_name, agent_emoji, agent_role, ...task } = row;
  if (agent_name) {
    task.assigned_agent = { name: agent_name, avatar_emoji: agent_emoji, role: agent_role };
  }
  return task;
}

// ─── Start ───────────────────────────────────────────────
const port = parseInt(process.env.PORT || '18790');

// Ensure DB is initialized
getDb();

serve({ fetch: app.fetch, port }, () => {
  console.log(`🚀 Mission Control API running at http://localhost:${port}`);
});

export default app;
