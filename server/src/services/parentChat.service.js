import { v4 as uuidv4 } from 'uuid';
import * as parentChatDb from '../db/queries/parentChat.js';
import * as users from '../db/queries/users.js';

function enrichWithSenderName(msg) {
  const sender = msg.sender_user_id ? users.getById(msg.sender_user_id) : null;
  return { ...msg, senderUserName: sender?.name ?? null };
}

export function list(familyId) {
  return parentChatDb.listByFamily(familyId).map(enrichWithSenderName);
}

export function create(io, { familyId, senderUserId, body }) {
  const id = uuidv4();
  const msg = parentChatDb.create({
    id,
    family_id: familyId,
    sender_user_id: senderUserId,
    body,
  });
  const enriched = enrichWithSenderName(msg);
  if (io) {
    io.to(`family:${familyId}`).emit('parent_chat:new', enriched);
  }
  return enriched;
}

export function remove(io, { messageId, familyId }) {
  const msg = parentChatDb.getById(messageId);
  if (!msg || msg.family_id !== familyId) return false;
  parentChatDb.remove(messageId);
  if (io) {
    io.to(`family:${familyId}`).emit('parent_chat:deleted', { id: messageId });
  }
  return true;
}
