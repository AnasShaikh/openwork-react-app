/**
 * Minimal toast notifications, replacing `alert()`.
 *
 * `alert()` blocks the page, cannot be styled, and is suppressed or mangled by
 * some mobile browsers — so on a phone a user could get no feedback at all after
 * submitting a transaction. This keeps the same one-call ergonomics so call
 * sites migrate cleanly, but renders in-page and non-blocking.
 *
 * Deliberately dependency-free and framework-agnostic: it is a tiny pub/sub, so
 * it can be called from plain modules and event handlers, not only components.
 */

let nextId = 1;
const listeners = new Set();
let toasts = [];

const AUTO_DISMISS_MS = { success: 4000, info: 5000, error: 8000 };

/**
 * Infers a variant from the message text.
 *
 * A heuristic, used because these call sites were migrated from `alert()` in
 * bulk and carried no severity. Pass an explicit variant when it matters — the
 * heuristic is a reasonable default, not a guarantee.
 */
function inferVariant(message) {
  const text = String(message).toLowerCase();
  if (/✅|🎉|success|saved|completed|uploaded|deleted successfully|submitted/.test(text)) {
    return 'success';
  }
  if (/fail|error|could not|cannot|unable|invalid|denied|rejected|not found|insufficient|too many|expired/.test(text)) {
    return 'error';
  }
  return 'info';
}

function emit() {
  for (const listener of listeners) listener(toasts);
}

function dismiss(id) {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

/**
 * @param {string} message
 * @param {'success'|'error'|'info'} [variant] omit to infer from the message
 */
export function notify(message, variant) {
  const text = String(message ?? '').trim();
  if (!text) return null;

  const kind = variant || inferVariant(text);
  const id = nextId++;

  // Collapse duplicates so a retry loop cannot stack identical toasts.
  const existing = toasts.find((toast) => toast.message === text && toast.variant === kind);
  if (existing) return existing.id;

  toasts = [...toasts, { id, message: text, variant: kind }];
  emit();

  const ttl = AUTO_DISMISS_MS[kind] ?? 5000;
  setTimeout(() => dismiss(id), ttl);

  return id;
}

notify.success = (message) => notify(message, 'success');
notify.error = (message) => notify(message, 'error');
notify.info = (message) => notify(message, 'info');
notify.dismiss = dismiss;

/** Subscribe to the toast list. Returns an unsubscribe function. */
export function subscribeToasts(listener) {
  listeners.add(listener);
  listener(toasts);
  return () => listeners.delete(listener);
}

export { dismiss as dismissToast };
export default notify;
