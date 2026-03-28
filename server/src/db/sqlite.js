import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'homework.db');

let db = null;
let SQL = null;

export async function initDb() {
  if (db) return db;
  SQL = await initSqlJs();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let data;
  if (fs.existsSync(dbPath)) {
    data = new Uint8Array(fs.readFileSync(dbPath));
  }
  db = new SQL.Database(data || undefined);
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');
  return db;
}

function save() {
  if (!db) return;
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export function run(sql, params = []) {
  const database = getDb();
  database.run(sql, params);
  save();
  return {};
}

export function get(sql, params = []) {
  const database = getDb();
  const stmt = database.prepare(sql);
  try {
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      return row;
    }
    return undefined;
  } finally {
    stmt.free();
  }
}

export function all(sql, params = []) {
  const database = getDb();
  const stmt = database.prepare(sql);
  const rows = [];
  try {
    stmt.bind(params);
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    return rows;
  } finally {
    stmt.free();
  }
}

export function exec(sql) {
  getDb().exec(sql);
  save();
}

/**
 * Run multiple statements atomically; persists once on commit.
 * @param {(run: (sql: string, params?: unknown[]) => void) => void} fn
 */
export function withTransaction(fn) {
  const database = getDb();
  database.run('BEGIN IMMEDIATE');
  try {
    fn((sql, params = []) => {
      database.run(sql, params);
    });
    database.run('COMMIT');
    save();
  } catch (e) {
    try {
      database.run('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw e;
  }
}
