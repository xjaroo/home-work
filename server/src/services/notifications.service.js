import { v4 as uuidv4 } from 'uuid';
import * as notifications from '../db/queries/notifications.js';

export function create(io, { familyId, userId, type, payload }) {
  const id = uuidv4();
  const payload_json = payload ? JSON.stringify(payload) : null;
  const row = notifications.create({ id, family_id: familyId, user_id: userId, type, payload_json });
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', row);
  }
  return row;
}
