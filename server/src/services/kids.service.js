import { v4 as uuidv4 } from 'uuid';
import { hashSync } from '../lib/bcrypt.js';
import * as users from '../db/queries/users.js';

export function listKids(familyId) {
  return users.listKidsByFamily(familyId);
}

export function getKid(kidId, familyId) {
  const user = users.getById(kidId);
  if (!user || user.family_id !== familyId || user.role !== 'kid') return null;
  return user;
}

export function createKid({ familyId, name, email, password, createdByParentId }) {
  const existing = users.getByEmail(email);
  if (existing) {
    const err = new Error('Email already used');
    err.status = 409;
    throw err;
  }
  const id = uuidv4();
  const password_hash = hashSync(password, 10);
  return users.create({
    id,
    family_id: familyId,
    role: 'kid',
    name,
    email,
    password_hash,
  });
}

export function updateKid(kidId, familyId, fields) {
  const kid = getKid(kidId, familyId);
  if (!kid) return null;
  const { password, ...rest } = fields;
  const updateFields = { ...rest };
  if (password) {
    updateFields.password_hash = hashSync(password, 10);
  }
  updateFields.updated_at = new Date().toISOString();
  return users.update(kidId, updateFields);
}

export function deleteKid(kidId, familyId) {
  const kid = getKid(kidId, familyId);
  if (!kid) return null;
  return users.softDelete(kidId);
}
