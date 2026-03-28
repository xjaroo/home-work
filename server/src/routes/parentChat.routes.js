import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import * as parentChatService from '../services/parentChat.service.js';

const router = Router();

function requireFamilyChatParticipant(req, res, next) {
  if (req.user.role !== 'parent' && req.user.role !== 'kid') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

export function createParentChatRouter(getIo) {
  const io = () => getIo ? getIo() : null;

  router.get(
    '/',
    requireAuth,
    requireFamilyChatParticipant,
    (req, res, next) => {
      try {
        const list = parentChatService.list(req.user.family_id);
        res.json(list);
      } catch (e) {
        next(e);
      }
    }
  );

  router.post(
    '/',
    requireAuth,
    requireFamilyChatParticipant,
    validate(z.object({ body: z.string().min(1).max(5000) })),
    (req, res, next) => {
      try {
        const msg = parentChatService.create(io(), {
          familyId: req.user.family_id,
          senderUserId: req.user.id,
          body: req.valid.body.trim(),
        });
        res.status(201).json(msg);
      } catch (e) {
        next(e);
      }
    }
  );

  router.delete(
    '/:id',
    requireAuth,
    requireRole('parent'),
    (req, res, next) => {
      try {
        const removed = parentChatService.remove(io(), {
          messageId: req.params.id,
          familyId: req.user.family_id,
        });
        if (!removed) {
          return res.status(404).json({ error: 'Message not found' });
        }
        res.status(204).send();
      } catch (e) {
        next(e);
      }
    }
  );

  return router;
}
