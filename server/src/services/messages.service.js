import { v4 as uuidv4 } from 'uuid';
import * as messagesDb from '../db/queries/messages.js';
import * as users from '../db/queries/users.js';

function enrichWithSenderName(msg) {
  const sender = msg.sender_user_id ? users.getById(msg.sender_user_id) : null;
  return { ...msg, senderUserName: sender?.name ?? null };
}

export function listByKid(familyId, kidUserId) {
  return messagesDb.listByKid(familyId, kidUserId).map(enrichWithSenderName);
}

export function create(io, { familyId, kidUserId, senderUserId, body }) {
  const id = uuidv4();
  const msg = messagesDb.create({
    id,
    family_id: familyId,
    kid_user_id: kidUserId,
    sender_user_id: senderUserId,
    body,
  });
  const enriched = enrichWithSenderName(msg);
  if (io) {
    io.to(`family:${familyId}`).emit('message:new', enriched);
  }
  return enriched;
}
