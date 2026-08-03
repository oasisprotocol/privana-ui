import { createPersistedStore } from './createPersistedStore'

export type TurnkeyWalletIntent = 'embedded' | 'connected'

// Only 'embedded' is persisted. 'connected' stays in memory (so it still wakes TurnkeySync)
// but is never restored on reload — a stale persisted 'connected' would suppress the
// null→'connected' transition that does the waking.
const store = createPersistedStore<TurnkeyWalletIntent>(
  'turnkey.wallet-intent',
  raw => (raw === 'embedded' ? 'embedded' : null),
  intent => (intent === 'embedded' ? 'embedded' : null),
)

export const getTurnkeyWalletIntent = store.get
export const setTurnkeyWalletIntent = store.set
export const useTurnkeyWalletIntent = store.use
