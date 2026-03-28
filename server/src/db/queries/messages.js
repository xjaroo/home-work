import { get, all, run } from '../sqlite.js';

export function create({ id, family_id, kid_user_id, sender_user_id, body }) {
  run(
    `INSERT INTO messages (id, family_id, kid_user_id, sender_user_id, body)
     VALUES (?, ?, ?, ?, ?)`,
    [id, family_id, kid_user_id, sender_user_id, body]
  );
  return get('SELECT * FROM messages WHERE id = ?', [id]);
}

export function listByKid(familyId, kidUserId) {
  return all(
    'SELECT * FROM messages WHERE family_id = ? AND kid_user_id = ? ORDER BY created_at ASC',
    [familyId, kidUserId]
  );
}

export function markRead(id) {
  run("UPDATE messages SET read_at = datetime('now') WHERE id = ? AND read_at IS NULL", [id]);
  return get('SELECT * FROM messages WHERE id = ?', [id]);
}
