import { Router } from 'express';
import { z } from 'zod';
import { hashSync, compareSync } from '../lib/bcrypt.js';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import * as families from '../db/queries/families.js';
import * as users from '../db/queries/users.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const PASSWORD_MIN = 8;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const registerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN).regex(PASSWORD_REGEX, 'Password must include at least one letter and one number'),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts' },
});

router.post(
  '/register',
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.valid;
      const existing = users.getByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      const familyId = uuidv4();
      const familyName = `${name.trim()}'s Family`;
      families.create(familyId, familyName);
      const parentId = uuidv4();
      const password_hash = hashSync(password, 10);
      users.create({
        id: parentId,
        family_id: familyId,
        role: 'parent',
        name,
        email,
        password_hash,
      });
      req.session.userId = parentId;
      const user = users.getById(parentId);
      const family = families.getById(familyId);
      res.status(201).json({ user, family });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.valid;
      const user = users.getByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const match = compareSync(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      req.session.userId = user.id;
      const out = users.getById(user.id);
      const family = families.getById(out.family_id);
      res.json({ user: out, family });
    } catch (e) {
      next(e);
    }
  }
);

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => {
  const family = families.getById(req.user.family_id);
  let impersonatedBy = null;
  const impId = req.session.impersonatorUserId;
  if (impId) {
    const adminUser = users.getById(impId);
    if (adminUser) {
      impersonatedBy = { id: adminUser.id, name: adminUser.name, email: adminUser.email };
    }
  }
  res.json({ user: req.user, family: family || null, impersonatedBy });
});

router.post('/stop-impersonation', requireAuth, (req, res) => {
  const impId = req.session.impersonatorUserId;
  if (!impId) {
    return res.status(400).json({ error: 'Not testing as another account' });
  }
  const adminUser = users.getById(impId);
  if (!adminUser) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.status(401).json({ error: 'Admin session is no longer valid' });
    });
    return;
  }
  req.session.userId = impId;
  delete req.session.impersonatorUserId;
  const family = families.getById(adminUser.family_id);
  res.json({ user: adminUser, family: family || null });
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  password: z.string().min(PASSWORD_MIN).max(200).optional(),
});

router.patch(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.valid;
      const userId = req.user.id;
      const updates = {};
      if (name !== undefined) updates.name = name.trim();
      if (email !== undefined) {
        const trimmed = email.trim().toLowerCase();
        const existing = users.getByEmail(trimmed);
        if (existing && existing.id !== userId) {
          return res.status(409).json({ error: 'Email already in use' });
        }
        updates.email = trimmed;
      }
      if (password !== undefined && password.length > 0) {
        updates.password_hash = hashSync(password, 10);
      }
      if (Object.keys(updates).length === 0) {
        return res.json({ user: req.user });
      }
      const updated = users.update(userId, updates);
      res.json({ user: updated });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
