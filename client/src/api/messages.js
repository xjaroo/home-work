import { apiGet, apiPost, apiDelete } from './client.js';

export function listMessages(kidId) {
  return apiGet(`/messages?kidId=${kidId}`);
}

export function sendMessage(kidId, body) {
  return apiPost('/messages', { kidId, body });
}

export function listParentChat() {
  return apiGet('/parent-chat');
}

export function sendParentChatMessage(body) {
  return apiPost('/parent-chat', { body });
}

export function deleteParentChatMessage(id) {
  return apiDelete(`/parent-chat/${id}`);
}
