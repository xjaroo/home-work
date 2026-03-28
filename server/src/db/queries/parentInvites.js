import { get, all, run } from '../sqlite.js';

const INVITE_EXPIRY_DAYS = 7;

export function create({ id, family_id, email, token, invited_by_user_id }) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  const expires_at = expiresAt.toISOString();
  run(
    `INSERT INTO parent_invites (id, family_id, email, token, invited_by_user_id, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, family_id, email.toLowerCase().trim(), token, invited_by_user_id, expires_at]
  );
  return get('SELECT * FROM parent_invites WHERE id = ?', [id]);
}

export function getByToken(token) {
  return get('SELECT * FROM parent_invites WHERE token = ?', [token]);
}

export function getExistingByFamilyAndEmail(familyId, email) {
  return get(
    'SELECT * FROM parent_invites WHERE family_id = ? AND email = ? AND expires_at > datetime(\'now\') ORDER BY created_at DESC LIMIT 1',
    [familyId, email]
  );
}

export function getById(id) {
  return get('SELECT * FROM parent_invites WHERE id = ?', [id]);
}

export function listByFamily(familyId) {
  return all(
    'SELECT * FROM parent_invites WHERE family_id = ? AND expires_at > datetime(\'now\') ORDER BY created_at DESC',
    [familyId]
  );
}

export function deleteById(id) {
  run('DELETE FROM parent_invites WHERE id = ?', [id]);
}

export function deleteByToken(token) {
  run('DELETE FROM parent_invites WHERE token = ?', [token]);
}
