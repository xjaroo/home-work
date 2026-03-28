import { get, run, all } from '../sqlite.js';

export function create(id, name = null) {
  run(
    `INSERT INTO families (id, name) VALUES (?, ?)`,
    [id, name]
  );
  return get('SELECT * FROM families WHERE id = ?', [id]);
}

export function getById(id) {
  return get('SELECT * FROM families WHERE id = ?', [id]);
}

export function listAll() {
  return all('SELECT id, name, created_at FROM families ORDER BY name COLLATE NOCASE');
}

export function update(id, fields) {
  const allowed = ['name', 'updated_at'];
  const set = [];
  const values = [];
  for (const [k, v] of Object.entries(fields)) {
    if (allowed.includes(k) && v !== undefined) {
      set.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (set.length === 0) return getById(id);
  set.push("updated_at = datetime('now')");
  values.push(id);
  run(`UPDATE families SET ${set.join(', ')} WHERE id = ?`, values);
  return getById(id);
}
