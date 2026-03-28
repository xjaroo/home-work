import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import * as messagesService from '../services/messages.service.js';
import * as users from '../db/queries/users.js';

const uuidSchema = z.string().uuid();

export function createMessagesRouter(getIo) {
  const router = Router();
  const io = () => getIo ? getIo() : null;

  router.get(
    '/',
    requireAuth,
    validate(z.object({ kidId: uuidSchema })),
    (req, res, next) => {
      const { kidId } = req.valid;
      if (req.user.role === 'kid' && kidId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (req.user.role === 'parent') {
        const kid = users.getById(kidId);
        if (!kid || kid.family_id !== req.user.family_id) {
          return res.status(404).json({ error: 'Kid not found' });
        }
      }
      const list = messagesService.listByKid(req.user.family_id, kidId);
      res.json(list);
    }
  );

  router.post(
    '/',
    requireAuth,
    validate(z.object({
      kidId: uuidSchema,
      body: z.string().min(1).max(5000),
    })),
    (req, res, next) => {
      const { kidId, body } = req.valid;
      if (req.user.role === 'kid' && kidId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (req.user.role === 'parent') {
        const kid = users.getById(kidId);
        if (!kid || kid.family_id !== req.user.family_id) {
          return res.status(404).json({ error: 'Kid not found' });
        }
      }
      const msg = messagesService.create(io(), {
        familyId: req.user.family_id,
        kidUserId: kidId,
        senderUserId: req.user.id,
        body,
      });
      res.status(201).json(msg);
    }
  );

  return router;
}
