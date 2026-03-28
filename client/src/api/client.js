const BASE = import.meta.env.VITE_API_BASE || '';

export async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText || 'Request failed');
  }
  return data;
}

export function apiGet(path) {
  return api(path, { method: 'GET' });
}

export function apiPost(path, body) {
  return api(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

export function apiPatch(path, body) {
  return api(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
}

export function apiDelete(path) {
  return api(path, { method: 'DELETE' });
}
