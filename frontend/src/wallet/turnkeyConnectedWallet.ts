import { useSyncExternalStore } from 'react'

export interface ConnectedWalletRecord {
  providerKey: string
  address: `0x${string}`
}

const STORAGE_KEY = 'turnkey.connected-wallet'

function readStored(): ConnectedWalletRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConnectedWalletRecord>
    if (typeof parsed?.providerKey === 'string' && typeof parsed?.address === 'string') {
      return { providerKey: parsed.providerKey, address: parsed.address as `0x${string}` }
    }
  } catch {
    // Malformed or blocked storage: treat as no record.
  }
  return null
}

let current: ConnectedWalletRecord | null = readStored()
const listeners = new Set<() => void>()

export function setConnectedWalletRecord(record: ConnectedWalletRecord | null): void {
  if (current === record) return
  current = record
  if (typeof window !== 'undefined') {
    try {
      if (record) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Blocked storage: keep the in-memory value; nothing to persist.
    }
  }
  listeners.forEach(listener => listener())
}

export function getConnectedWalletRecord(): ConnectedWalletRecord | null {
  return current
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useConnectedWalletRecord(): ConnectedWalletRecord | null {
  return useSyncExternalStore(subscribe, getConnectedWalletRecord, getConnectedWalletRecord)
}
