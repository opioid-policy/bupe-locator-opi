// src/lib/anti-spam.ts
// Turnstile-free bot check, same approach as the main OPI site
// (2026 updates/api/_antispam.php): a hidden honeypot field that humans
// never see plus a "how long was the form open" timing trap. Nothing about
// the visitor is stored or sent to a third party.

export const HONEYPOT_FIELD = 'website';
export const TIMESTAMP_FIELD = '_t';

const MIN_FORM_AGE_MS = 3_000;            // faster than a human could fill it in
const MAX_FORM_AGE_MS = 12 * 60 * 60_000; // stale page, ask them to reload

export interface AntiSpamInput {
  website?: unknown;
  _t?: unknown;
}

export type AntiSpamResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export function checkAntiSpam(input: AntiSpamInput, now = Date.now()): AntiSpamResult {
  const honeypot = input[HONEYPOT_FIELD];
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    // Bots fill every field. Answer like a validation error so they learn nothing.
    return { ok: false, status: 400, error: 'Invalid submission' };
  }

  const raw = input[TIMESTAMP_FIELD];
  const loadedAt = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(loadedAt)) {
    return { ok: false, status: 400, error: 'Invalid submission' };
  }

  const age = now - loadedAt;
  if (age < MIN_FORM_AGE_MS) {
    return { ok: false, status: 400, error: 'Please take a moment before submitting' };
  }
  if (age > MAX_FORM_AGE_MS) {
    return { ok: false, status: 400, error: 'This page has been open too long. Please reload and try again' };
  }

  return { ok: true };
}
