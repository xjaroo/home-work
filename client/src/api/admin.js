import { apiGet, apiPatch, apiPost, apiDelete } from './client.js';

export function fetchAdminUsers() {
  return apiGet('/admin/users');
}

export function fetchAdminFamilies() {
  return apiGet('/admin/families');
}

export function createAdminFamily(name) {
  return apiPost('/admin/families', { name });
}

export function createAdminParentInvite(body) {
  return apiPost('/admin/parent-invites', body);
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

/** Admin only: switch session to the given kid user for testing (sets impersonation). */
export function impersonateAdminAsKid(userId) {
  return apiPost(`/admin/users/${userId}/impersonate-as-kid`);
}
