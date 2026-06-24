import { useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'privana.theme'

const mql = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null
const listeners = new Set<() => void>()

function readStored(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

let preference: ThemePreference = readStored()

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return mql?.matches ? 'dark' : 'light'
  return pref
}

function apply(): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolve(preference) === 'dark')
}

function emit(): void {
  for (const listener of listeners) listener()
}

export function setThemePreference(pref: ThemePreference): void {
  if (preference === pref) return
  preference = pref
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, pref)
  apply()
  emit()
}

mql?.addEventListener('change', () => {
  if (preference === 'system') {
    apply()
    emit()
  }
})

apply()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    subscribe,
    () => preference,
    () => 'system',
  )
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(
    subscribe,
    () => resolve(preference),
    () => 'light',
  )
}
