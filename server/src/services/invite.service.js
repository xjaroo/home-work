import { v4 as uuidv4 } from 'uuid';
import * as parentInvites from '../db/queries/parentInvites.js';
import * as users from '../db/queries/users.js';
import * as families from '../db/queries/families.js';
import { hashSync } from '../lib/bcrypt.js';

const TOKEN_BYTES = 24;

function generateToken() {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').slice(0, 8);
}

export function createInvite({ familyId, email, invitedByUserId }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingParent = users.listByFamily(familyId).find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingParent && existingParent.role === 'parent') {
    const err = new Error('This person is already a parent in your family');
    err.status = 409;
    throw err;
  }
  const existingInvite = parentInvites.getExistingByFamilyAndEmail(familyId, normalizedEmail);
  if (existingInvite) {
    return { ...existingInvite, reused: true };
  }
  const token = generateToken();
  const id = uuidv4();
  parentInvites.create({
    id,
    family_id: familyId,
    email: normalizedEmail,
    token,
    invited_by_user_id: invitedByUserId,
  });
  return { ...parentInvites.getByToken(token), reused: false };
}

export function getInviteInfo(token) {
  const invite = parentInvites.getByToken(token);
  if (!invite) return null;
  if (new Date(invite.expires_at) < new Date()) return null;
  const family = families.getById(invite.family_id);
  return { email: invite.email, familyName: family?.name || 'the family' };
}

export function acceptInvite(token, userId) {
  const invite = parentInvites.getByToken(token);
  if (!invite) {
    const err = new Error('Invite link is invalid or has expired');
    err.status = 404;
    throw err;
  }
  if (new Date(invite.expires_at) < new Date()) {
    parentInvites.deleteByToken(token);
    const err = new Error('Invite link has expired');
    err.status = 410;
    throw err;
  }
  const user = users.getById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 401;
    throw err;
  }
  if (user.email.toLowerCase() !== invite.email) {
    const err = new Error('This invite was sent to a different email address. Please log in with that account.');
    err.status = 403;
    throw err;
  }
  users.joinFamilyAsParent(userId, invite.family_id);
  parentInvites.deleteByToken(token);
  return users.getById(userId);
}

export function acceptInviteWithSignup(token, name, password, setSession) {
  const invite = parentInvites.getByToken(token);
  if (!invite) {
    const err = new Error('Invite link is invalid or has expired');
    err.status = 404;
    throw err;
  }
  if (new Date(invite.expires_at) < new Date()) {
    parentInvites.deleteByToken(token);
    const err = new Error('Invite link has expired');
    err.status = 410;
    throw err;
  }
  const existing = users.getByEmail(invite.email);
  if (existing) {
    const err = new Error('An account with this email already exists. Please log in and then accept the invite.');
    err.status = 409;
    throw err;
  }
  const userId = uuidv4();
  const password_hash = hashSync(password, 10);
  users.create({
    id: userId,
    family_id: invite.family_id,
    role: 'parent',
    name: name.trim(),
    email: invite.email,
    password_hash,
  });
  parentInvites.deleteByToken(token);
  setSession(userId);
  const user = users.getById(userId);
  const family = families.getById(invite.family_id);
  return { user, family };
}
