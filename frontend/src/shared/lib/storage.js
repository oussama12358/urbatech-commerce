export function readStorage(key, fallback) {
  try {
    // Prefer sessionStorage for session-scoped items, fall back to localStorage
    const session = sessionStorage.getItem(key);
    if (session) return JSON.parse(session);
    const local = localStorage.getItem(key);
    if (local) return JSON.parse(local);
    return fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
