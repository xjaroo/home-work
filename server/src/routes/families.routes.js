import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import * as families from '../db/queries/families.js';
import * as users from '../db/queries/users.js';

const router = Router();

router.get('/me', requireAuth, (req, res) => {
  const family = families.getById(req.user.family_id);
  res.json(family || { id: req.user.family_id, name: null });
});

router.get('/me/members', requireAuth, (req, res) => {
  const members = users.listByFamily(req.user.family_id);
  res.json({ members });
});

router.patch(
  '/me',
  requireAuth,
  requireRole('parent'),
  validate(z.object({ name: z.string().min(1).max(200) })),
  (req, res, next) => {
    try {
      const updated = families.update(req.user.family_id, { name: req.valid.name.trim() });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
