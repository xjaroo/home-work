import { apiGet, apiPost, apiPatch, apiDelete } from './client.js';

export function listTasks(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiGet(q ? `/tasks?${q}` : '/tasks');
}

export function getTask(id) {
  return apiGet(`/tasks/${id}`);
}

export function createTask(data) {
  const body = {
    title: data.title,
    description: data.description,
    dueDate: data.dueDate,
  };
  if (data.kidId) body.kidId = data.kidId;
  return apiPost('/tasks', body);
}

export function updateTask(id, data) {
  return apiPatch(`/tasks/${id}`, data);
}

export function updateTaskStatus(id, status) {
  return apiPatch(`/tasks/${id}/status`, { status });
}

export function archiveTask(id) {
  return apiPost(`/tasks/${id}/archive`);
}

export function deleteTask(id) {
  return apiDelete(`/tasks/${id}`);
}
