import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { schema } from './db/schema';
// Test the DB schema and query patterns directly
describe('Database Schema', () => {
    let db;
    beforeAll(() => {
        db = new Database(':memory:');
        db.pragma('foreign_keys = ON');
        db.exec(schema);
    });
    afterAll(() => {
        db.close();
    });
    it('creates tasks table', () => {
        const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'").get();
        expect(result).toBeTruthy();
        expect(result.name).toBe('tasks');
    });
    it('creates agents table', () => {
        const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='agents'").get();
        expect(result).toBeTruthy();
    });
    it('inserts and queries a task', () => {
        db.prepare(`INSERT INTO tasks (id, title, status, priority) VALUES (?, ?, ?, ?)`).run('t1', 'Test', 'inbox', 'normal');
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get('t1');
        expect(task.title).toBe('Test');
        expect(task.status).toBe('inbox');
    });
    it('inserts an agent and assigns to task', () => {
        db.prepare(`INSERT INTO agents (id, name, role) VALUES (?, ?, ?)`).run('a1', 'Marcus', 'Builder');
        db.prepare(`UPDATE tasks SET assigned_agent_id = ? WHERE id = ?`).run('a1', 't1');
        const task = db.prepare('SELECT t.*, a.name as agent_name FROM tasks t LEFT JOIN agents a ON t.assigned_agent_id = a.id WHERE t.id = ?').get('t1');
        expect(task.agent_name).toBe('Marcus');
    });
    it('enforces valid task status', () => {
        expect(() => {
            db.prepare(`INSERT INTO tasks (id, title, status, priority) VALUES (?, ?, ?, ?)`).run('t-bad', 'Bad', 'invalid_status', 'normal');
        }).toThrow();
    });
    it('enforces valid priority', () => {
        expect(() => {
            db.prepare(`INSERT INTO tasks (id, title, status, priority) VALUES (?, ?, ?, ?)`).run('t-bad2', 'Bad', 'inbox', 'super_urgent');
        }).toThrow();
    });
    it('creates and queries activities', () => {
        db.prepare(`INSERT INTO task_activities (id, task_id, activity_type, message) VALUES (?, ?, ?, ?)`).run('act1', 't1', 'spawned', 'Sub-agent spawned');
        const activities = db.prepare('SELECT * FROM task_activities WHERE task_id = ?').all('t1');
        expect(activities).toHaveLength(1);
        expect(activities[0].activity_type).toBe('spawned');
    });
    it('creates deliverables', () => {
        db.prepare(`INSERT INTO task_deliverables (id, task_id, deliverable_type, title, path) VALUES (?, ?, ?, ?, ?)`).run('d1', 't1', 'file', 'Output', '/tmp/out.txt');
        const deliverables = db.prepare('SELECT * FROM task_deliverables WHERE task_id = ?').all('t1');
        expect(deliverables).toHaveLength(1);
        expect(deliverables[0].deliverable_type).toBe('file');
    });
    it('cascades task deletion to activities and deliverables', () => {
        db.prepare('DELETE FROM tasks WHERE id = ?').run('t1');
        const activities = db.prepare('SELECT * FROM task_activities WHERE task_id = ?').all('t1');
        const deliverables = db.prepare('SELECT * FROM task_deliverables WHERE task_id = ?').all('t1');
        expect(activities).toHaveLength(0);
        expect(deliverables).toHaveLength(0);
    });
});
