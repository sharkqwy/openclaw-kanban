import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { schema, migrations } from './schema.js';
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'mission-control.db');
let db = null;
export function getDb() {
    if (!db) {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        db.exec(schema);
        // Run migrations (safe to re-run)
        for (const migration of migrations) {
            try {
                db.exec(migration);
            }
            catch { /* column/index already exists */ }
        }
        console.log('[DB] Initialized at:', DB_PATH);
    }
    return db;
}
export function closeDb() {
    if (db) {
        db.close();
        db = null;
    }
}
export function queryAll(sql, params = []) {
    return getDb().prepare(sql).all(...params);
}
export function queryOne(sql, params = []) {
    return getDb().prepare(sql).get(...params);
}
export function run(sql, params = []) {
    return getDb().prepare(sql).run(...params);
}
export function transaction(fn) {
    return getDb().transaction(fn)();
}
