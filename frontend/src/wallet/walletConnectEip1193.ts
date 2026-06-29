import { type EIP1193Provider } from 'viem'

// Turnkey surfaces a WalletConnect wallet not as an EIP-1193 provider but as a
// Wallet-Standard shape: `request()` plus a single `standard:events` "change"
// stream (see @turnkey/core .../wallet-connect/base — makeProvider). The change
// payload is `{ type: 'disconnect' | 'chainChanged' | 'update' | ... }` and `on`
// returns an unsubscribe closure — there is no `.on('accountsChanged')` / no
// `removeListener`. The wagmi connector (turnkeyConnector) only speaks EIP-1193
// events, so casting this provider straight to EIP1193Provider crashes the moment
// it does `provider.on('accountsChanged', ...)`. This adapter bridges the two.
export interface WalletConnectProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
  features: {
    'standard:events': {
      on: (event: string, callback: (evt: WalletConnectChangeEvent) => void) => () => void
    }
  }
}

interface WalletConnectChangeEvent {
  type: string
  chainId?: string
}

export function isWalletConnectProvider(provider: unknown): provider is WalletConnectProvider {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    typeof (provider as Partial<WalletConnectProvider>).features?.['standard:events']?.on === 'function'
  )
}

// WalletConnect reports chain ids as bare ("1"), hex ("0x1"), or CAIP-2
// ("eip155:1"). Normalize to the hex form EIP-1193 `chainChanged` listeners expect.
function normalizeChainId(raw?: string): string | undefined {
  if (!raw) return undefined
  const tail = raw.includes(':') ? (raw.split(':').pop() ?? raw) : raw
  const value = tail.startsWith('0x') ? parseInt(tail, 16) : Number(tail)
  return Number.isFinite(value) ? `0x${value.toString(16)}` : undefined
}

// Wrap a Turnkey WalletConnect provider in an EIP-1193 surface: `request` is a
// passthrough, and `on`/`removeListener` fan the single `change` stream out to the
// `accountsChanged` / `chainChanged` / `disconnect` events the connector listens
// for. WalletConnect omits the account list from its events, so `update` triggers
// an `eth_accounts` re-fetch. The underlying `change` subscription is opened lazily
// on the first listener and torn down once the last one is removed.
export function walletConnectToEip1193(wc: WalletConnectProvider): EIP1193Provider {
  const listeners = new Map<string, Set<(...args: never[]) => void>>()
  const emit = (event: string, ...args: unknown[]) =>
    listeners.get(event)?.forEach(listener => (listener as (...a: unknown[]) => void)(...args))

  let unsubscribeChange: (() => void) | undefined
  const ensureSubscribed = () => {
    if (unsubscribeChange) return
    unsubscribeChange = wc.features['standard:events'].on('change', evt => {
      switch (evt.type) {
        case 'disconnect':
          emit('disconnect')
          break
        case 'chainChanged': {
          const chainId = normalizeChainId(evt.chainId)
          if (chainId) emit('chainChanged', chainId)
          break
        }
        case 'update':
          // No account list on the event — pull the current accounts on demand.
          void wc
            .request({ method: 'eth_accounts' })
            .then(accounts => emit('accountsChanged', accounts as string[]))
            .catch(() => {})
          break
      }
    })
  }
  const teardownIfIdle = () => {
    if (!unsubscribeChange) return
    for (const set of listeners.values()) if (set.size > 0) return
    unsubscribeChange()
    unsubscribeChange = undefined
  }

  const on = (event: string, listener: (...args: never[]) => void) => {
    let set = listeners.get(event)
    if (!set) listeners.set(event, (set = new Set()))
    set.add(listener)
    ensureSubscribed()
  }
  const removeListener = (event: string, listener: (...args: never[]) => void) => {
    listeners.get(event)?.delete(listener)
    teardownIfIdle()
  }

  const request = ((args: { method: string; params?: unknown[] }) =>
    wc.request(args)) as EIP1193Provider['request']

  return { request, on, removeListener } as unknown as EIP1193Provider
}
