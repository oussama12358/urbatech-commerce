const subscribers = new Set();

// simple dedupe cache to avoid showing the exact same message multiple times
// within a short timeframe (ms)
const recentMessages = new Map();
const DEDUPE_WINDOW_MS = 3000;

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function showToast(message, type = "info", duration = 5000) {
  try {
    const now = Date.now();
    const key = `${type}:${String(message)}`;
    const last = recentMessages.get(key) || 0;
    if (now - last < DEDUPE_WINDOW_MS) {
      // skip duplicate toast
      return null;
    }
    recentMessages.set(key, now);
    // prune old entries occasionally
    if (recentMessages.size > 100) {
      for (const [k, ts] of recentMessages.entries()) {
        if (now - ts > DEDUPE_WINDOW_MS) recentMessages.delete(k);
      }
    }

    const id = Date.now() + Math.random().toString(36).slice(2, 8);
    const toast = { id, message, type, duration };
    for (const fn of Array.from(subscribers)) fn({ type: "add", toast });
    setTimeout(() => {
      for (const fn of Array.from(subscribers)) fn({ type: "remove", id });
    }, duration);
    return id;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('showToast error', e);
    return null;
  }
}

export function removeToast(id) {
  for (const fn of Array.from(subscribers)) fn({ type: "remove", id });
}

export default { subscribe, showToast, removeToast };
