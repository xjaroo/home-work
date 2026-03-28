import { apiGet, apiPatch } from './client.js';

export function getFamily() {
  return apiGet('/families/me');
}

export function updateFamilyName(name) {
  return apiPatch('/families/me', { name });
}

export function getFamilyMembers() {
  return apiGet('/families/me/members');
}
