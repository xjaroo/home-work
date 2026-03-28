import { get, all, run } from '../sqlite.js';

const USER_PUBLIC_COLS =
  'id, family_id, role, name, email, is_admin, created_at, updated_at';

export function create({ id, family_id, role, name, email, password_hash, is_admin = 0 }) {
  const adminVal = is_admin ? 1 : 0;
  run(
    `INSERT INTO users (id, family_id, role, name, email, password_hash, is_admin)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, family_id, role, name, email, password_hash, adminVal]
  );
  return get(`SELECT ${USER_PUBLIC_COLS} FROM users WHERE id = ?`, [id]);
}

export function getById(id) {
  return get(
    `SELECT ${USER_PUBLIC_COLS} FROM users WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
}

export function getByIdWithHash(id) {
  return get('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
}

export function getByEmail(email) {
  return get('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
}

export function listByFamily(familyId) {
  return all(
    `SELECT ${USER_PUBLIC_COLS} FROM users WHERE family_id = ? AND deleted_at IS NULL ORDER BY role, name`,
    [familyId]
  );
}

export function listKidsByFamily(familyId) {
  return all(
    `SELECT ${USER_PUBLIC_COLS} FROM users WHERE family_id = ? AND role = ? AND deleted_at IS NULL ORDER BY name`,
    [familyId, 'kid']
  );
}

export function listAllForAdmin() {
  return all(
    `SELECT u.id, u.family_id, u.role, u.name, u.email, u.is_admin, u.deleted_at, u.created_at, u.updated_at,
            f.name AS family_name
     FROM users u
     LEFT JOIN families f ON f.id = u.family_id
     ORDER BY (u.deleted_at IS NULL) DESC, u.created_at DESC`
  );
}

export function countActiveAdmins() {
  const row = get(
    `SELECT COUNT(*) AS n FROM users WHERE is_admin = 1 AND deleted_at IS NULL`
  );
  return row?.n ?? 0;
}

export function getByIdAny(id) {
  return get(`SELECT ${USER_PUBLIC_COLS}, deleted_at FROM users WHERE id = ?`, [id]);
}

export function adminUpdate(id, fields) {
  const allowed = ['name', 'email', 'password_hash', 'role', 'is_admin', 'family_id', 'updated_at'];
  const set = [];
  const values = [];
  for (const [k, v] of Object.entries(fields)) {
    if (allowed.includes(k) && v !== undefined) {
      set.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (set.length === 0) return getByIdAny(id);
  values.push(id);
  run(`UPDATE users SET ${set.join(', ')} WHERE id = ?`, values);
  return getByIdAny(id);
}

export function restoreUser(id) {
  const now = new Date().toISOString();
  run('UPDATE users SET deleted_at = NULL, updated_at = ? WHERE id = ?', [now, id]);
  return getByIdAny(id);
}

export function update(id, fields) {
  const allowed = ['name', 'email', 'password_hash', 'updated_at'];
  const set = [];
  const values = [];
  for (const [k, v] of Object.entries(fields)) {
    if (allowed.includes(k) && v !== undefined) {
      set.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (set.length === 0) return getById(id);
  values.push(id);
  run(`UPDATE users SET ${set.join(', ')} WHERE id = ?`, values);
  return getById(id);
}

export function softDelete(id) {
  const now = new Date().toISOString();
  run('UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
  return getById(id);
}

export function joinFamilyAsParent(userId, familyId) {
  const now = new Date().toISOString();
  run('UPDATE users SET family_id = ?, role = ?, updated_at = ? WHERE id = ?', [familyId, 'parent', now, userId]);
  return getById(userId);
}
