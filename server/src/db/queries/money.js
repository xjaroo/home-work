import { get, all, run } from '../sqlite.js';

export function create(row) {
  run(
    `INSERT INTO money_transactions (id, family_id, kid_user_id, type, amount_cents, note, status, created_by_user_id, decided_by_parent_id, decided_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.family_id,
      row.kid_user_id,
      row.type,
      row.amount_cents,
      row.note ?? null,
      row.status ?? 'approved',
      row.created_by_user_id,
      row.decided_by_parent_id ?? null,
      row.decided_at ?? null,
    ]
  );
  return get('SELECT * FROM money_transactions WHERE id = ?', [row.id]);
}

export function getById(id) {
  return get('SELECT * FROM money_transactions WHERE id = ?', [id]);
}

export function listByKid(kidId) {
  return all(
    'SELECT * FROM money_transactions WHERE kid_user_id = ? ORDER BY created_at DESC',
    [kidId]
  );
}

export function updateStatus(id, status, decidedByParentId) {
  const now = new Date().toISOString();
  run(
    'UPDATE money_transactions SET status = ?, decided_by_parent_id = ?, decided_at = ? WHERE id = ?',
    [status, decidedByParentId, now, id]
  );
  return getById(id);
}

export function deleteById(id) {
  run('DELETE FROM money_transactions WHERE id = ?', [id]);
}
