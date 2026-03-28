import * as users from '../db/queries/users.js';

/**
 * Promotes listed emails to platform admin + parent on every server start (idempotent).
 * Set ADMIN_EMAILS in .env as comma-separated addresses (e.g. you@example.com,other@example.com).
 */
export function syncEnvAdmins() {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw?.trim()) return;

  const emails = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  for (const email of emails) {
    const u = users.getByEmail(email);
    if (!u) {
      console.warn(`[ADMIN_EMAILS] No active user with email ${email}; skipping`);
      continue;
    }
    if (u.role === 'parent' && u.is_admin) continue;

    const now = new Date().toISOString();
    users.adminUpdate(u.id, {
      role: 'parent',
      is_admin: 1,
      updated_at: now,
    });
    console.log(`[ADMIN_EMAILS] Granted admin + parent to ${email}`);
  }
}
