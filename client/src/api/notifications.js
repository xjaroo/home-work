import { apiGet, apiPost } from './client.js';

export function listNotifications() {
  return apiGet('/notifications');
}

export function markNotificationRead(id) {
  return apiPost(`/notifications/${id}/read`);
}
