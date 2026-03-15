/**
 * Seed script to add sample EPIC with child tasks.
 * Run after server starts if the EPIC doesn't exist.
 */
import { queryOne, run } from './db/index.js';
import { v4 as uuid } from 'uuid';

export function seedEpicIfNeeded() {
  // Check if we already have the EPIC
  const existing = queryOne<any>('SELECT id FROM tasks WHERE title = ? AND is_epic = 1', ['A1D.ai — MVP Launch']);
  if (existing) return;

  const epicId = uuid();
  const now = new Date().toISOString();

  // Create EPIC
  run(
    `INSERT INTO tasks (id, title, description, status, priority, is_epic, task_order, created_at, updated_at)
     VALUES (?, ?, ?, 'active', 'high', 1, 0, ?, ?)`,
    [epicId, 'A1D.ai — MVP Launch', 'Complete MVP launch with core features: auth, dashboard, and landing page.', now, now]
  );

  // Child tasks
  const children = [
    { title: 'Implement auth flow (signup/login)', status: 'done' as const },
    { title: 'Build main dashboard UI', status: 'active' as const },
    { title: 'Design and deploy landing page', status: 'inbox' as const },
  ];

  for (const [i, child] of children.entries()) {
    run(
      `INSERT INTO tasks (id, title, status, priority, parent_task_id, task_order, created_at, updated_at)
       VALUES (?, ?, ?, 'normal', ?, ?, ?, ?)`,
      [uuid(), child.title, child.status, epicId, i + 1, now, now]
    );
  }

  console.log(`[SEED] Created EPIC "A1D.ai — MVP Launch" with 3 child tasks`);
}
