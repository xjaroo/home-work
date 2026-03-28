import { hashSync } from '../lib/bcrypt.js';
import * as users from '../db/queries/users.js';
import * as families from '../db/queries/families.js';
import { permanentDeleteUserRecords } from '../db/queries/userPurge.js';

const PASSWORD_MIN = 8;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export function listUsers() {
  return users.listAllForAdmin();
}

export function listFamilies() {
  return families.listAll();
}

export function getUserRecord(userId) {
  return users.getByIdAny(userId);
}

/** Active kid only (getById excludes soft-deleted). */
export function getKidForImpersonation(kidUserId) {
  const kid = users.getById(kidUserId);
  if (!kid) {
    const err = new Error('User not found or deactivated');
    err.status = 404;
    throw err;
  }
  if (kid.role !== 'kid') {
    const err = new Error('Only kid accounts can be opened for testing');
    err.status = 400;
    throw err;
  }
  const family = families.getById(kid.family_id);
  return { user: kid, family: family || null };
}

/**
 * @param {string} actorId - authenticated admin user id
 * @param {string} targetId
 * @param {{ name?: string, email?: string, role?: 'parent'|'kid', is_admin?: boolean, family_id?: string, password?: string }} payload
 */
export function updateUser(actorId, targetId, payload) {
  const target = users.getByIdAny(targetId);
  if (!target) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name.trim();
  if (payload.email !== undefined) {
    const trimmed = payload.email.trim().toLowerCase();
    const existing = users.getByEmail(trimmed);
    if (existing && existing.id !== targetId) {
      const err = new Error('Email already in use');
      err.status = 409;
      throw err;
    }
    updates.email = trimmed;
  }
  if (payload.role !== undefined) {
    if (payload.role !== 'parent' && payload.role !== 'kid') {
      const err = new Error('Invalid role');
      err.status = 400;
      throw err;
    }
    updates.role = payload.role;
  }
  if (payload.family_id !== undefined) {
    const fam = families.getById(payload.family_id);
    if (!fam) {
      const err = new Error('Family not found');
      err.status = 404;
      throw err;
    }
    updates.family_id = payload.family_id;
  }
  if (payload.is_admin !== undefined) {
    const nextAdmin = payload.is_admin ? 1 : 0;
    if (!nextAdmin && target.is_admin && Number(users.countActiveAdmins()) <= 1) {
      const err = new Error('Cannot remove the last active admin');
      err.status = 400;
      throw err;
    }
    if (!nextAdmin && actorId === targetId && target.is_admin) {
      const err = new Error('You cannot remove your own admin access');
      err.status = 400;
      throw err;
    }
    updates.is_admin = nextAdmin;
  }
  if (payload.password !== undefined && payload.password.length > 0) {
    if (payload.password.length < PASSWORD_MIN || !PASSWORD_REGEX.test(payload.password)) {
      const err = new Error('Password must be at least 8 characters with a letter and a number');
      err.status = 400;
      throw err;
    }
    updates.password_hash = hashSync(payload.password, 10);
  }

  if (Object.keys(updates).length === 0) {
    return target;
  }
  updates.updated_at = new Date().toISOString();
  return users.adminUpdate(targetId, updates);
}

export function deactivateUser(actorId, targetId) {
  if (actorId === targetId) {
    const err = new Error('You cannot deactivate your own account');
    err.status = 400;
    throw err;
  }
  const target = users.getByIdAny(targetId);
  if (!target) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (target.deleted_at) {
    return target;
  }
  if (target.is_admin && Number(users.countActiveAdmins()) <= 1) {
    const err = new Error('Cannot deactivate the last active admin');
    err.status = 400;
    throw err;
  }
  users.softDelete(targetId);
  return users.getByIdAny(targetId);
}

export function reactivateUser(targetId) {
  const target = users.getByIdAny(targetId);
  if (!target) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (!target.deleted_at) {
    return target;
  }
  users.restoreUser(targetId);
  return users.getByIdAny(targetId);
}

/**
 * Permanently deletes DB rows for this user (tasks, messages, money they own, etc.).
 * Only allowed after the account has been deactivated (soft-deleted).
 */
export function permanentlyDeleteUser(actorId, targetId) {
  if (actorId === targetId) {
    const err = new Error('You cannot delete your own account');
    err.status = 400;
    throw err;
  }
  const target = users.getByIdAny(targetId);
  if (!target) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (!target.deleted_at) {
    const err = new Error('Deactivate this user before permanently deleting them');
    err.status = 400;
    throw err;
  }
  permanentDeleteUserRecords(targetId);
}
