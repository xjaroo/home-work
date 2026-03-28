import { apiGet, apiPost, apiDelete } from './client.js';

export function getBalance(kidId) {
  return apiGet(`/money/kids/${kidId}/balance`);
}

export function getTransactions(kidId) {
  return apiGet(`/money/kids/${kidId}/transactions`);
}

export function addAllowance(kidId, amountCents, note) {
  return apiPost(`/money/kids/${kidId}/allowance`, { amountCents, note });
}

export function addPenalty(kidId, amountCents, note) {
  return apiPost(`/money/kids/${kidId}/penalty`, { amountCents, note });
}

export function createSpendRequest(kidId, amountCents, note) {
  return apiPost(`/money/kids/${kidId}/spend-requests`, { amountCents, note });
}

export function approveSpendRequest(txId) {
  return apiPost(`/money/spend-requests/${txId}/approve`);
}

export function declineSpendRequest(txId) {
  return apiPost(`/money/spend-requests/${txId}/decline`);
}

export function removeTransaction(txId) {
  return apiDelete(`/money/transactions/${txId}`);
}
