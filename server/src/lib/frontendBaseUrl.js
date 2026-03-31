export function frontendBaseUrl() {
  const raw = process.env.FRONTEND_ORIGIN?.trim();
  if (!raw) return 'http://localhost:5173';
  const firstOrigin = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)[0];
  return firstOrigin || 'http://localhost:5173';
}
