import { useSyncExternalStore } from 'react'

// A small localStorage-backed external store with React subscription. `decode` turns a
// stored string into a value (or null if absent/invalid); `encode` turns a value into the
// string to store, or null to remove it — which lets a value stay in memory (and notify
// subscribers) without being persisted. Access fails soft when storage is blocked.
export function createPersistedStore<T>(
  key: string,
  decode: (raw: string) => T | null,
  encode: (value: T) => string | null,
) {
  const read = (): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(key)
      return raw == null ? null : decode(raw)
    } catch {
      return null
    }
  }

  let current = read()
  const listeners = new Set<() => void>()

  const get = (): T | null => current

  const set = (value: T | null): void => {
    if (current === value) return
    current = value
    if (typeof window !== 'undefined') {
      try {
        const encoded = value == null ? null : encode(value)
        if (encoded == null) window.localStorage.removeItem(key)
        else window.localStorage.setItem(key, encoded)
      } catch {
        // Blocked storage: keep the in-memory value; nothing to persist.
      }
    }
    listeners.forEach(listener => listener())
  }

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const use = (): T | null => useSyncExternalStore(subscribe, get, get)

  return { get, set, use }
}
