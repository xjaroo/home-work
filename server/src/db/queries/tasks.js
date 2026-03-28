import { get, all, run } from '../sqlite.js';

export function create(row) {
  run(
    `INSERT INTO tasks (id, family_id, kid_user_id, title, description, due_date, status, created_by_parent_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.family_id,
      row.kid_user_id,
      row.title,
      row.description ?? null,
      row.due_date,
      row.status ?? 'todo',
      row.created_by_parent_id ?? null,
    ]
  );
  return getById(row.id);
}

export function getById(id) {
  return get('SELECT * FROM tasks WHERE id = ?', [id]);
}

export function list({ familyId, kidId, status }) {
  let sql = 'SELECT * FROM tasks WHERE family_id = ?';
  const params = [familyId];
  if (kidId) {
    sql += ' AND kid_user_id = ?';
    params.push(kidId);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY due_date ASC, created_at DESC';
  return all(sql, params);
}

export function update(id, fields) {
  const allowed = ['title', 'description', 'due_date', 'status', 'completed_at', 'approved_at', 'updated_at'];
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
  run(`UPDATE tasks SET ${set.join(', ')} WHERE id = ?`, values);
  return getById(id);
}

export function insertActivity(row) {
  run(
    `INSERT INTO task_activity (id, task_id, actor_user_id, action, from_status, to_status, message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.task_id, row.actor_user_id, row.action, row.from_status ?? null, row.to_status ?? null, row.message ?? null]
  );
}

export function deleteById(id) {
  run('DELETE FROM task_activity WHERE task_id = ?', [id]);
  run('DELETE FROM tasks WHERE id = ?', [id]);
}
