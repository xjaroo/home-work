import { v4 as uuidv4 } from 'uuid';
import * as moneyDb from '../db/queries/money.js';
import * as users from '../db/queries/users.js';
import { create as createNotification } from './notifications.service.js';

function getBalanceCents(kidId) {
  const rows = moneyDb.listByKid(kidId);
  let balance = 0;
  for (const row of rows) {
    if (row.type === 'allowance' || row.type === 'penalty') {
      balance += row.amount_cents;
    } else if (row.type === 'spend_approved') {
      balance += row.amount_cents; // amount_cents is negative
    }
    // spend_request pending doesn't change balance; spend_declined ignored
  }
  return balance;
}

export function getBalance(kidId) {
  return { balanceCents: getBalanceCents(kidId) };
}

function enrichTxWithNames(tx) {
  const createdBy = tx.created_by_user_id ? users.getById(tx.created_by_user_id) : null;
  const decidedBy = tx.decided_by_parent_id ? users.getById(tx.decided_by_parent_id) : null;
  return {
    ...tx,
    createdByUserName: createdBy?.name ?? null,
    decidedByParentName: decidedBy?.name ?? null,
  };
}

export function listTransactions(kidId) {
  return moneyDb.listByKid(kidId).map(enrichTxWithNames);
}

export function addAllowance(io, { familyId, kidId, amountCents, note, createdByUserId }) {
  const id = uuidv4();
  const tx = moneyDb.create({
    id,
    family_id: familyId,
    kid_user_id: kidId,
    type: 'allowance',
    amount_cents: Math.abs(amountCents),
    note: note || null,
    status: 'approved',
    created_by_user_id: createdByUserId,
  });
  if (io) {
    io.to(`family:${familyId}`).to(`user:${kidId}`).emit('money:transaction_created', tx);
    io.to(`family:${familyId}`).to(`user:${kidId}`).emit('money:balance_updated', { kidId, balanceCents: getBalanceCents(kidId) });
  }
  return tx;
}

export function addPenalty(io, { familyId, kidId, amountCents, note, createdByUserId }) {
  const id = uuidv4();
  const tx = moneyDb.create({
    id,
    family_id: familyId,
    kid_user_id: kidId,
    type: 'penalty',
    amount_cents: -Math.abs(amountCents),
    note: note || null,
    status: 'approved',
    created_by_user_id: createdByUserId,
  });
  if (io) {
    io.to(`family:${familyId}`).to(`user:${kidId}`).emit('money:transaction_created', tx);
    io.to(`family:${familyId}`).to(`user:${kidId}`).emit('money:balance_updated', { kidId, balanceCents: getBalanceCents(kidId) });
  }
  return tx;
}

export function createSpendRequest(io, { familyId, kidId, amountCents, note, createdByUserId }) {
  const id = uuidv4();
  const tx = moneyDb.create({
    id,
    family_id: familyId,
    kid_user_id: kidId,
    type: 'spend_request',
    amount_cents: -Math.abs(amountCents),
    note: note || null,
    status: 'pending',
    created_by_user_id: createdByUserId,
  });
  if (io) {
    io.to(`family:${familyId}`).emit('money:transaction_created', tx);
    const parents = users.listByFamily(familyId).filter((u) => u.role === 'parent');
    for (const p of parents) {
      createNotification(io, {
        familyId,
        userId: p.id,
        type: 'SPEND_REQUESTED',
        payload: { tx, kidId },
      });
    }
  }
  return tx;
}

export function approveSpendRequest(io, txId, decidedByParentId) {
  const tx = moneyDb.getById(txId);
  if (!tx || tx.type !== 'spend_request' || tx.status !== 'pending') {
    const err = new Error('Spend request not found or not pending');
    err.status = 400;
    throw err;
  }
  moneyDb.updateStatus(txId, 'approved', decidedByParentId);
  const approvedId = uuidv4();
  const decidedAt = new Date().toISOString();
  moneyDb.create({
    id: approvedId,
    family_id: tx.family_id,
    kid_user_id: tx.kid_user_id,
    type: 'spend_approved',
    amount_cents: tx.amount_cents,
    note: tx.note,
    status: 'approved',
    created_by_user_id: tx.created_by_user_id,
    decided_by_parent_id: decidedByParentId,
    decided_at: decidedAt,
  });
  const balanceCents = getBalanceCents(tx.kid_user_id);
  if (io) {
    io.to(`family:${tx.family_id}`).to(`user:${tx.kid_user_id}`).emit('money:transaction_created', { ...tx, status: 'approved' });
    io.to(`family:${tx.family_id}`).to(`user:${tx.kid_user_id}`).emit('money:balance_updated', { kidId: tx.kid_user_id, balanceCents });
  }
  return moneyDb.getById(txId);
}

export function declineSpendRequest(io, txId, decidedByParentId) {
  const tx = moneyDb.getById(txId);
  if (!tx || tx.type !== 'spend_request' || tx.status !== 'pending') {
    const err = new Error('Spend request not found or not pending');
    err.status = 400;
    throw err;
  }
  moneyDb.updateStatus(txId, 'declined', decidedByParentId);
  if (io) {
    io.to(`family:${tx.family_id}`).to(`user:${tx.kid_user_id}`).emit('money:transaction_created', { ...tx, status: 'declined' });
  }
  return moneyDb.getById(txId);
}

export function removeTransaction(io, txId, familyId) {
  const tx = moneyDb.getById(txId);
  if (!tx || tx.family_id !== familyId) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  if (tx.type !== 'allowance' && tx.type !== 'penalty') {
    const err = new Error('Only allowance or penalty transactions can be removed');
    err.status = 400;
    throw err;
  }
  moneyDb.deleteById(txId);
  const balanceCents = getBalanceCents(tx.kid_user_id);
  if (io) {
    io.to(`family:${tx.family_id}`).to(`user:${tx.kid_user_id}`).emit('money:balance_updated', { kidId: tx.kid_user_id, balanceCents });
    io.to(`family:${tx.family_id}`).to(`user:${tx.kid_user_id}`).emit('money:transaction_removed', { txId });
  }
  return { removed: true, balanceCents };
}
