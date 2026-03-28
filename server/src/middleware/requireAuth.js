import * as users from '../db/queries/users.js';

export function requireAuth(req, res, next) {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = users.getById(userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Session invalid' });
  }
  req.user = user;
  next();
}
