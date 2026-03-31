import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import * as inviteService from '../services/invite.service.js';
import * as families from '../db/queries/families.js';
import { frontendBaseUrl } from '../lib/frontendBaseUrl.js';

const router = Router();
const PASSWORD_MIN = 8;

router.post(
  '/invite',
  requireAuth,
  requireRole('parent'),
  validate(z.object({ email: z.string().email() })),
  (req, res, next) => {
    try {
      const invite = inviteService.createInvite({
        familyId: req.user.family_id,
        email: req.valid.email,
        invitedByUserId: req.user.id,
      });
      const baseUrl = frontendBaseUrl();
      const inviteLink = `${baseUrl}/invite/accept?token=${invite.token}`;
      res.status(201).json({ token: invite.token, inviteLink, reused: invite.reused ?? false, email: invite.email });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/info',
  validate(z.object({ token: z.string().min(1) })),
  (req, res, next) => {
    try {
      const info = inviteService.getInviteInfo(req.valid.token);
      if (!info) return res.status(404).json({ error: 'Invite link is invalid or has expired' });
      res.json(info);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/signup',
  validate(z.object({
    token: z.string().min(1),
    name: z.string().min(1).max(200),
    password: z.string().min(PASSWORD_MIN).max(200),
  })),
  (req, res, next) => {
    try {
      const { token, name, password } = req.valid;
      const setSession = (userId) => { req.session.userId = userId; };
      const { user, family } = inviteService.acceptInviteWithSignup(token, name, password, setSession);
      res.status(201).json({ user, family });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/accept',
  requireAuth,
  validate(z.object({ token: z.string().min(1) })),
  (req, res, next) => {
    try {
      const user = inviteService.acceptInvite(req.valid.token, req.user.id);
      const family = families.getById(user.family_id);
      res.json({ user, family });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
