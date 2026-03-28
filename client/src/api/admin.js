import { apiGet, apiPatch, apiPost, apiDelete } from './client.js';

export function fetchAdminUsers() {
  return apiGet('/admin/users');
}

export function fetchAdminFamilies() {
  return apiGet('/admin/families');
}

export function patchAdminUser(userId, body) {
  return apiPatch(`/admin/users/${userId}`, body);
}

export function deactivateAdminUser(userId) {
  return apiPost(`/admin/users/${userId}/deactivate`);
}

export function reactivateAdminUser(userId) {
  return apiPost(`/admin/users/${userId}/reactivate`);
}

export function permanentlyDeleteAdminUser(userId) {
  return apiDelete(`/admin/users/${userId}`);
}
