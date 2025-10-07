export const TX_HEADER = 'x-transaction-id';
export const ALT_HEADER = 'x-request-id';

let counter = 0;
const resetInterval = 10000;

export function extractTxIdFromKafkaHeaders(headers?: Record<string, unknown>) {
  if (!headers) return undefined;
  const raw = headers[TX_HEADER] ?? headers[ALT_HEADER];

  if (!raw) return undefined;
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return raw.toString();

  return undefined;
}

export function ensureTxId(headers?: Record<string, unknown>) {
  return extractTxIdFromKafkaHeaders(headers) ?? generateTxId();
}

export function generateTxId() {
  const now = Date.now();
  counter = (counter + 1) % resetInterval;
  return `${now}-${counter.toString(36)}`;
}
