import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getDb, get, run, exec } from './sqlite.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

export async function migrate() {
  await initDb();
  const db = getDb();
  exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  let files = [];
  try {
    files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  } catch {
    return;
  }

  for (const file of files) {
    const name = file;
    const existing = get('SELECT 1 FROM _migrations WHERE name = ?', [name]);
    if (existing) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    exec(sql);
    run('INSERT INTO _migrations (name) VALUES (?)', [name]);
  }
}
