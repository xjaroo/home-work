import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { validate } from '../middleware/validate.js';
import * as adminService from '../services/admin.service.js';

const uuidSchema = z.string().uuid();

const PASSWORD_MIN = 8;
const passwordField = z
  .string()
  .min(PASSWORD_MIN)
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must include at least one letter and one number');

const patchUserSchema = z
  .object({
    userId: uuidSchema,
    name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    role: z.enum(['parent', 'kid']).optional(),
    is_admin: z.boolean().optional(),
    family_id: uuidSchema.optional(),
    password: z.union([passwordField, z.literal('')]).optional(),
  })
  .refine(
    (d) =>
      d.name !== undefined ||
      d.email !== undefined ||
      d.role !== undefined ||
      d.is_admin !== undefined ||
      d.family_id !== undefined ||
      (d.password !== undefined && d.password.length > 0),
    { message: 'At least one field to update is required' }
  );

const createFamilySchema = z.object({
  name: z.string().min(1).max(200),
});

const createParentInviteSchema = z.object({
  family_id: uuidSchema,
  email: z.string().email(),
});

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/users', (_req, res) => {
  res.json(adminService.listUsers());
});

router.get('/families', (_req, res) => {
  res.json(adminService.listFamilies());
});

router.post('/families', validate(createFamilySchema), (req, res, next) => {
  try {
    const family = adminService.createFamily(req.valid.name);
    res.status(201).json(family);
  } catch (e) {
    next(e);
  }
});

router.post('/parent-invites', validate(createParentInviteSchema), (req, res, next) => {
  try {
    const invite = adminService.createParentOnboardingInvite(req.user.id, req.valid);
    const baseUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    const onboardingUrl = `${baseUrl}/invite/accept?token=${invite.token}`;
    res.status(201).json({
      ...invite,
      onboardingUrl,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/users/:userId', validate(z.object({ userId: uuidSchema })), (req, res) => {
  const row = adminService.getUserRecord(req.valid.userId);
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json(row);
});

router.post(
  '/users/:userId/impersonate-as-kid',
  validate(z.object({ userId: uuidSchema })),
  (req, res, next) => {
    try {
      if (req.session.impersonatorUserId) {
        return res.status(400).json({
          error: 'Already testing as another account. Return to your admin session first.',
        });
      }
      const { user, family } = adminService.getKidForImpersonation(req.valid.userId);
      req.session.impersonatorUserId = req.user.id;
      req.session.userId = user.id;
      res.json({ user, family });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/users/:userId',
  validate(patchUserSchema),
  (req, res, next) => {
    try {
      const { userId, password, ...rest } = req.valid;
      const payload = { ...rest };
      if (password && password.length > 0) payload.password = password;
      const updated = adminService.updateUser(req.user.id, userId, payload);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/users/:userId/deactivate',
  validate(z.object({ userId: uuidSchema })),
  (req, res, next) => {
    try {
      const row = adminService.deactivateUser(req.user.id, req.valid.userId);
      res.json(row);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/users/:userId/reactivate',
  validate(z.object({ userId: uuidSchema })),
  (req, res, next) => {
    try {
      const row = adminService.reactivateUser(req.valid.userId);
      res.json(row);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/users/:userId',
  validate(z.object({ userId: uuidSchema })),
  (req, res, next) => {
    try {
      adminService.permanentlyDeleteUser(req.user.id, req.valid.userId);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
