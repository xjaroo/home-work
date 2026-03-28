import { apiPost } from './client.js';

export function createInvite(email) {
  return apiPost('/parents/invite', { email });
}

export function getInviteInfo(token) {
  return apiPost('/invite/info', { token });
}

export function acceptInviteWithSignup(token, name, password) {
  return apiPost('/invite/signup', { token, name, password });
}

export function acceptInvite(token) {
  return apiPost('/invite/accept', { token });
}
