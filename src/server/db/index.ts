import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { schema, migrations } from './schema.js';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'mission-control.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(schema);

    // Run migrations (safe to re-run)
    for (const migration of migrations) {
      try { db.exec(migration); } catch { /* column/index already exists */ }
    }

    console.log('[DB] Initialized at:', DB_PATH);
  }
  return db;
}

export function closeDb(): void {
  if (db) { db.close(); db = null; }
}

export function queryAll<T>(sql: string, params: unknown[] = []): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: unknown[] = []): Database.RunResult {
  return getDb().prepare(sql).run(...params);
}

export function transaction<T>(fn: () => T): T {
  return getDb().transaction(fn)();
}
