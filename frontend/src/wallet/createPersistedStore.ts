import { useSyncExternalStore } from 'react'

// A small localStorage-backed external store with React subscription. `decode` turns a
// stored string into a value (or null if absent/invalid); `encode` turns a value into the
// string to store, or null to remove it — which lets a value stay in memory (and notify
// subscribers) without being persisted. Access fails soft when storage is blocked.
//
// Cross-tab aware: a write in another tab fires a `storage` event, which we use to re-read
// and notify subscribers here, so all tabs converge (e.g. a sign-out in one tab clears the
// wallet state in the others). The writing tab notifies its own subscribers synchronously in
// `set` — `storage` events only fire in other tabs.
export function createPersistedStore<T>(
  key: string,
  decode: (raw: string) => T | null,
  encode: (value: T) => string | null,
) {
  const safeDecode = (raw: string | null): T | null => {
    if (raw == null) return null
    try {
      return decode(raw)
    } catch {
      return null
    }
  }

  const read = (): T | null => {
    if (typeof window === 'undefined') return null
    try {
      return safeDecode(window.localStorage.getItem(key))
    } catch {
      return null
    }
  }

  let current = read()
  const listeners = new Set<() => void>()
  const notify = (): void => listeners.forEach(listener => listener())

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
    notify()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', event => {
      if (event.storageArea !== window.localStorage) return
      // event.key is null on a full clear(); otherwise it must be our key.
      if (event.key !== null && event.key !== key) return
      const next = safeDecode(event.newValue)
      if (next === current) return
      current = next
      notify()
    })
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
