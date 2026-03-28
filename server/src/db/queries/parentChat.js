import { get, all, run } from '../sqlite.js';

export function create(row) {
  run(
    `INSERT INTO parent_chat_messages (id, family_id, sender_user_id, body)
     VALUES (?, ?, ?, ?)`,
    [row.id, row.family_id, row.sender_user_id, row.body]
  );
  return get('SELECT * FROM parent_chat_messages WHERE id = ?', [row.id]);
}

export function getById(id) {
  return get('SELECT * FROM parent_chat_messages WHERE id = ?', [id]);
}

export function listByFamily(familyId) {
  return all(
    'SELECT * FROM parent_chat_messages WHERE family_id = ? ORDER BY created_at ASC',
    [familyId]
  );
}

export function remove(id) {
  run('DELETE FROM parent_chat_messages WHERE id = ?', [id]);
}
