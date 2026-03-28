import { apiPatch } from './client.js';

export function updateProfile(data) {
  return apiPatch('/auth/me', data);
}
