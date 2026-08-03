import { createPersistedStore } from './createPersistedStore'

export interface ConnectedWalletRecord {
  providerKey: string
  address: `0x${string}`
}

const store = createPersistedStore<ConnectedWalletRecord>(
  'turnkey.connected-wallet',
  raw => {
    const parsed = JSON.parse(raw) as Partial<ConnectedWalletRecord>
    if (typeof parsed?.providerKey === 'string' && typeof parsed?.address === 'string') {
      return { providerKey: parsed.providerKey, address: parsed.address as `0x${string}` }
    }
    return null
  },
  record => JSON.stringify(record),
)

export const getConnectedWalletRecord = store.get
export const setConnectedWalletRecord = store.set
export const useConnectedWalletRecord = store.use
