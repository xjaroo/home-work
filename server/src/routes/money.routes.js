import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import * as moneyService from '../services/money.service.js';
import * as users from '../db/queries/users.js';
import * as moneyDb from '../db/queries/money.js';

const uuidSchema = z.string().uuid();

function assertKidInFamily(req, kidId) {
  if (req.user.role === 'kid') {
    if (kidId !== req.user.id) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    return;
  }
  const kid = users.getById(kidId);
  if (!kid || kid.family_id !== req.user.family_id) {
    const err = new Error('Kid not found');
    err.status = 404;
    throw err;
  }
}

export function createMoneyRouter(getIo) {
  const router = Router();
  const io = () => getIo ? getIo() : null;

  router.get(
    '/kids/:kidId/balance',
    requireAuth,
    validate(z.object({ kidId: uuidSchema })),
    (req, res, next) => {
      try {
        assertKidInFamily(req, req.valid.kidId);
        const balance = moneyService.getBalance(req.valid.kidId);
        res.json(balance);
      } catch (e) {
        next(e);
      }
    }
  );

  router.get(
    '/kids/:kidId/transactions',
    requireAuth,
    validate(z.object({ kidId: uuidSchema })),
    (req, res, next) => {
      try {
        assertKidInFamily(req, req.valid.kidId);
        const list = moneyService.listTransactions(req.valid.kidId);
        res.json(list);
      } catch (e) {
        next(e);
      }
    }
  );

  router.post(
    '/kids/:kidId/allowance',
    requireAuth,
    requireRole('parent'),
    validate(z.object({
      kidId: uuidSchema,
      amountCents: z.number().int().positive(),
      note: z.string().max(500).optional(),
    })),
    (req, res, next) => {
      try {
        assertKidInFamily(req, req.valid.kidId);
        const tx = moneyService.addAllowance(io(), {
          familyId: req.user.family_id,
          kidId: req.valid.kidId,
          amountCents: req.valid.amountCents,
          note: req.valid.note,
          createdByUserId: req.user.id,
        });
        res.status(201).json(tx);
      } catch (e) {
        next(e);
      }
    }
  );

  router.post(
    '/kids/:kidId/penalty',
    requireAuth,
    requireRole('parent'),
    validate(z.object({
      kidId: uuidSchema,
      amountCents: z.number().int().positive(),
      note: z.string().max(500).optional(),
    })),
    (req, res, next) => {
      try {
        assertKidInFamily(req, req.valid.kidId);
        const tx = moneyService.addPenalty(io(), {
          familyId: req.user.family_id,
          kidId: req.valid.kidId,
          amountCents: req.valid.amountCents,
          note: req.valid.note,
          createdByUserId: req.user.id,
        });
        res.status(201).json(tx);
      } catch (e) {
        next(e);
      }
    }
  );

  router.post(
    '/kids/:kidId/spend-requests',
    requireAuth,
    requireRole('kid'),
    validate(z.object({
      kidId: uuidSchema,
      amountCents: z.number().int().positive(),
      note: z.string().max(500).optional(),
    })),
    (req, res, next) => {
      try {
        assertKidInFamily(req, req.valid.kidId);
        const tx = moneyService.createSpendRequest(io(), {
          familyId: req.user.family_id,
          kidId: req.valid.kidId,
          amountCents: req.valid.amountCents,
          note: req.valid.note,
          createdByUserId: req.user.id,
        });
        res.status(201).json(tx);
      } catch (e) {
        next(e);
      }
    }
  );

  router.post(
    '/spend-requests/:txId/approve',
    requireAuth,
    requireRole('parent'),
    validate(z.object({ txId: uuidSchema })),
    (req, res, next) => {
      try {
        const tx = moneyDb.getById(req.valid.txId);
        if (!tx || tx.family_id !== req.user.family_id) {
          return res.status(404).json({ error: 'Spend request not found' });
        }
        const updated = moneyService.approveSpendRequest(io(), req.valid.txId, req.user.id);
        res.json(updated);
      } catch (e) {
        next(e);
      }
    }
  );

  router.post(
    '/spend-requests/:txId/decline',
    requireAuth,
    requireRole('parent'),
    validate(z.object({ txId: uuidSchema })),
    (req, res, next) => {
      try {
        const tx = moneyDb.getById(req.valid.txId);
        if (!tx || tx.family_id !== req.user.family_id) {
          return res.status(404).json({ error: 'Spend request not found' });
        }
        const updated = moneyService.declineSpendRequest(io(), req.valid.txId, req.user.id);
        res.json(updated);
      } catch (e) {
        next(e);
      }
    }
  );

  router.delete(
    '/transactions/:txId',
    requireAuth,
    requireRole('parent'),
    validate(z.object({ txId: uuidSchema })),
    (req, res, next) => {
      try {
        const result = moneyService.removeTransaction(io(), req.valid.txId, req.user.family_id);
        res.json(result);
      } catch (e) {
        next(e);
      }
    }
  );

  return router;
}
