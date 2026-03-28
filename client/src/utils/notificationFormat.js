function formatDollarsFromCents(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return '';
  return `$${(Math.abs(n) / 100).toFixed(2)}`;
}

function parsePayload(payloadJson) {
  if (payloadJson == null || payloadJson === '') return null;
  if (typeof payloadJson === 'object') return payloadJson;
  try {
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

function titleCaseType(type) {
  if (!type || typeof type !== 'string') return 'Notification';
  return type
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * @param {string} type
 * @param {string | object | null | undefined} payloadJson
 * @returns {{ title: string; body: string | null }}
 */
export function formatNotificationDisplay(type, payloadJson) {
  const payload = parsePayload(payloadJson);

  if (type === 'TASK_DONE' && payload?.task) {
    const t = payload.task;
    const titleText = typeof t.title === 'string' && t.title.trim() ? t.title.trim() : 'A task';
    return {
      title: 'Task completed',
      body: titleText,
    };
  }

  if (type === 'SPEND_REQUESTED' && payload?.tx) {
    const tx = payload.tx;
    const amount = formatDollarsFromCents(tx.amount_cents);
    const note = typeof tx.note === 'string' && tx.note.trim() ? tx.note.trim() : null;
    return {
      title: 'Spend request',
      body: [amount, note].filter(Boolean).join(' — ') || 'A child requested a purchase.',
    };
  }

  return {
    title: titleCaseType(type),
    body: null,
  };
}
