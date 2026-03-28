import { get, all, run } from '../sqlite.js';

export function create({ id, family_id, user_id, type, payload_json }) {
  run(
    `INSERT INTO notifications (id, family_id, user_id, type, payload_json)
     VALUES (?, ?, ?, ?, ?)`,
    [id, family_id, user_id, type, payload_json ?? null]
  );
  return get('SELECT * FROM notifications WHERE id = ?', [id]);
}

export function getById(id) {
  return get('SELECT * FROM notifications WHERE id = ?', [id]);
}

export function listByUser(userId, limit = 50) {
  return all(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
}

export function markRead(id) {
  run("UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND read_at IS NULL", [id]);
  return getById(id);
}
