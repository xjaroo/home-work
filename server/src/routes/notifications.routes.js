import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import * as notificationsDb from '../db/queries/notifications.js';

const uuidSchema = z.string().uuid();

export function createNotificationsRouter() {
  const router = Router();

  router.get(
    '/',
    requireAuth,
    (req, res) => {
      const list = notificationsDb.listByUser(req.user.id);
      res.json(list);
    }
  );

  router.post(
    '/:id/read',
    requireAuth,
    validate(z.object({ id: uuidSchema })),
    (req, res, next) => {
      const notif = notificationsDb.getById(req.valid.id);
      if (!notif || notif.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      const updated = notificationsDb.markRead(req.valid.id);
      res.json(updated);
    }
  );

  return router;
}
