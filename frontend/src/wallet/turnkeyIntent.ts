import { useSyncExternalStore } from 'react'

export type TurnkeyWalletIntent = 'embedded' | 'connected'

const STORAGE_KEY = 'turnkey.wallet-intent'

function readStored(): TurnkeyWalletIntent | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'embedded' || value === 'connected' ? value : null
}

let current: TurnkeyWalletIntent | null = readStored()
const listeners = new Set<() => void>()

export function setTurnkeyWalletIntent(intent: TurnkeyWalletIntent | null): void {
  if (current === intent) return
  current = intent
  if (typeof window !== 'undefined') {
    if (intent) window.localStorage.setItem(STORAGE_KEY, intent)
    else window.localStorage.removeItem(STORAGE_KEY)
  }
  listeners.forEach(listener => listener())
}

export function getTurnkeyWalletIntent(): TurnkeyWalletIntent | null {
  return current
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useTurnkeyWalletIntent(): TurnkeyWalletIntent | null {
  return useSyncExternalStore(subscribe, getTurnkeyWalletIntent, getTurnkeyWalletIntent)
}
