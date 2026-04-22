/**
 * Load a value from localStorage with JSON parsing and a fallback default.
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    // ignore corrupt data
  }
  return fallback
}

