import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import * as kidsService from '../services/kids.service.js';

const uuidSchema = z.string().uuid();

export function createKidsRouter() {
  const router = Router();

  router.post(
    '/',
    requireAuth,
    requireRole('parent'),
    validate(z.object({
      name: z.string().min(1).max(200),
      email: z.string().email(),
      password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must include at least one letter and one number'),
    })),
    (req, res, next) => {
      try {
        const kid = kidsService.createKid({
          familyId: req.user.family_id,
          name: req.valid.name,
          email: req.valid.email,
          password: req.valid.password,
          createdByParentId: req.user.id,
        });
        res.status(201).json(kid);
      } catch (e) {
        next(e);
      }
    }
  );

  router.get(
    '/',
    requireAuth,
    requireRole('parent'),
    (req, res) => {
      const list = kidsService.listKids(req.user.family_id);
      res.json(list);
    }
  );

  router.get(
    '/:kidId',
    requireAuth,
    requireRole('parent'),
    validate(z.object({ kidId: uuidSchema })),
    (req, res, next) => {
      const kid = kidsService.getKid(req.valid.kidId, req.user.family_id);
      if (!kid) return res.status(404).json({ error: 'Kid not found' });
      res.json(kid);
    }
  );

  router.patch(
    '/:kidId',
    requireAuth,
    requireRole('parent'),
    validate(z.object({
      kidId: uuidSchema,
      name: z.string().min(1).max(200).optional(),
      email: z.string().email().optional(),
      password: z.string().min(8).optional(),
    })),
    (req, res, next) => {
      const { kidId, ...fields } = req.valid;
      const kid = kidsService.updateKid(kidId, req.user.family_id, fields);
      if (!kid) return res.status(404).json({ error: 'Kid not found' });
      res.json(kid);
    }
  );

  router.delete(
    '/:kidId',
    requireAuth,
    requireRole('parent'),
    validate(z.object({ kidId: uuidSchema })),
    (req, res, next) => {
      const kid = kidsService.getKid(req.valid.kidId, req.user.family_id);
      if (!kid) return res.status(404).json({ error: 'Kid not found' });
      kidsService.deleteKid(req.valid.kidId, req.user.family_id);
      res.status(204).send();
    }
  );

  return router;
}
