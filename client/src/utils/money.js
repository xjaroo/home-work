export function formatTxType(type, status) {
  if (type === 'allowance') return 'Allowance';
  if (type === 'penalty') return 'Penalty';
  if (type === 'spend_request') return status === 'pending' ? 'Spend request (pending)' : status === 'approved' ? 'Spend (approved)' : 'Spend (declined)';
  if (type === 'spend_approved') return 'Spend';
  if (type === 'spend_declined') return 'Spend declined';
  return type;
}

export function getTxDescription(t) {
  if (t.type === 'allowance' || t.type === 'penalty') return t.note || '—';
  return formatTxType(t.type, t.status) + (t.note ? ` – ${t.note}` : '');
}
