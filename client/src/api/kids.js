import { apiGet, apiPost, apiPatch, apiDelete } from './client.js';

export function listKids() {
  return apiGet('/kids');
}

export function getKid(id) {
  return apiGet(`/kids/${id}`);
}

export function createKid(data) {
  return apiPost('/kids', data);
}

export function updateKid(id, data) {
  return apiPatch(`/kids/${id}`, data);
}

export function deleteKid(id) {
  return apiDelete(`/kids/${id}`);
}
