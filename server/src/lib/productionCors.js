/**
 * Single-port production (PM2): SPA and API share PORT — allow the browser's Origin (reflect).
 * If FRONTEND_ORIGIN is set (comma-separated), only those origins are allowed (stricter).
 */
export function productionCorsOrigin() {
  const raw = process.env.FRONTEND_ORIGIN?.trim();
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return true;
}
