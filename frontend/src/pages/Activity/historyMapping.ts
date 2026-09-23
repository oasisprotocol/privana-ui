import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import type { EarnPool } from '@/api/earn'
import { isSwapLpAddress } from '@/config/swap'

export type DisplayKind =
  | 'swap'
  | 'earnDeposit'
  | 'earnWithdraw'
  | 'deposit'
  | 'withdraw'
  | 'lock'
  | 'lockModified'
  | 'lockReleased'
  | 'reclaimOut'
  | 'reclaimIn'
  | 'transfer'
  | 'unknown'

// Swaps and earn moves are rendered from services' own records, which carry
// the operation id and outcome; their accounting legs are hidden so nothing is
// listed twice. Classification still runs so the legs can be recognised.
export const HIDDEN_KINDS: ReadonlySet<DisplayKind> = new Set([
  'reclaimOut',
  'reclaimIn',
  'unknown',
  'swap',
  'earnDeposit',
  'earnWithdraw',
])

export type ClassifiedHistoryEntry = {
  source: 'chain'
  kind: DisplayKind
  // Position in the user's append-only on-chain history array. Absolute, so it
  // stays put as newer entries land — safe to key rows by.
  index: number
  timestamp: number
  tokenId: string | null
  amount: string | null
  counterparty: string | null
  pool: EarnPool | undefined
  entry: HistoryEntry
  // For swaps: the received ("to") leg. The base tokenId/amount carry the
  // sent ("from") leg so swap dedupe against the local copy keeps working.
  toTokenId?: string | null
  toAmount?: string | null
}

// The slice of history a ClassifiedHistoryEntry[] was built from.
export type HistoryWindow = {
  // Global index of entries[0].
  startIndex: number
  // Entry immediately preceding the window, when we fetched far enough back to
  // have it. Only used to recognise a swap pair the window cut through.
  leadIn?: HistoryEntry
}

// Every earn pool is served by one earn account, so a pool transfer's
// counterparty alone cannot say which pool it was; the token narrows it down
// until each pool has its own identity in history.
export const poolKey = (address: string, tokenId: string): string =>
  `${address.toLowerCase()}|${tokenId.toLowerCase()}`

export const indexPools = (pools: readonly EarnPool[]): Map<string, EarnPool> =>
  new Map(pools.map(p => [poolKey(p.pool_address, p.token_id), p]))

const isSwapOutLeg = (entry: HistoryEntry): boolean =>
  entry.kind === 'transferBalanceOut' && isSwapLpAddress(entry.counterparty)

const isSwapInLeg = (entry: HistoryEntry): boolean =>
  entry.kind === 'transferBalanceIn' && isSwapLpAddress(entry.counterparty)

// A swap is one atomic SwapManager.swap() call: Accounting appends the user's
// "out" leg and then their "in" leg with nothing in between (the LP's own legs
// go to the LP's array), so the two are always neighbours sharing a timestamp.
// On testnet the swap LP shares an address with an earn pool, so the *pair* —
// not the counterparty — is what distinguishes a swap from an earn move. An earn
// deposit and withdrawal landing in one block would otherwise look alike, hence
// the token check: a swap never sends and receives the same token.
const isSwapPair = (out: HistoryEntry, inLeg: HistoryEntry | undefined): boolean =>
  inLeg != null &&
  isSwapOutLeg(out) &&
  isSwapInLeg(inLeg) &&
  out.timestamp === inLeg.timestamp &&
  out.token_id !== inLeg.token_id

export function classifyHistory(
  entries: HistoryEntry[],
  poolsByAddressToken: Map<string, EarnPool>,
  window: HistoryWindow = { startIndex: 0 },
): ClassifiedHistoryEntry[] {
  const rows: ClassifiedHistoryEntry[] = []

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const index = window.startIndex + i

    if (isSwapPair(entry, entries[i + 1])) {
      const inLeg = entries[i + 1]
      rows.push({
        source: 'chain',
        kind: 'swap',
        index,
        timestamp: entry.timestamp,
        tokenId: entry.token_id ?? null,
        amount: entry.amount ?? null,
        counterparty: entry.counterparty ?? null,
        pool: undefined,
        entry,
        toTokenId: inLeg.token_id ?? null,
        toAmount: inLeg.amount ?? null,
      })
      i++
      continue
    }

    // The window can begin between a swap's two legs. Its "in" leg alone would
    // render as a bare transfer, so drop it rather than mislabel it.
    if (i === 0 && window.leadIn && isSwapPair(window.leadIn, entry)) continue

    rows.push(classify(entry, index, poolsByAddressToken))
  }

  return rows
}

function classify(
  entry: HistoryEntry,
  index: number,
  poolsByAddressToken: Map<string, EarnPool>,
): ClassifiedHistoryEntry {
  const counterpartyLower = entry.counterparty?.toLowerCase() ?? null
  const { kind, pool } = resolveKind(entry, counterpartyLower, poolsByAddressToken)

  return {
    source: 'chain',
    kind,
    index,
    timestamp: entry.timestamp,
    tokenId: entry.token_id ?? null,
    amount: entry.amount ?? null,
    counterparty: entry.counterparty ?? null,
    pool,
    entry,
  }
}

function resolveKind(
  entry: HistoryEntry,
  counterpartyLower: string | null,
  poolsByAddressToken: Map<string, EarnPool>,
): { kind: DisplayKind; pool?: EarnPool } {
  switch (entry.kind) {
    case 'deposit':
      return { kind: 'deposit' }
    case 'withdraw':
      return { kind: 'withdraw' }
    case 'createLock':
      return { kind: 'lock' }
    case 'modifyLock':
      return { kind: 'lockModified' }
    case 'unlockLock':
      return { kind: 'lockReleased' }
    case 'transferFromLockOut':
      return { kind: 'reclaimOut' }
    case 'transferFromLockIn':
      return { kind: 'reclaimIn' }
    case 'transferBalanceOut': {
      const matched =
        counterpartyLower && entry.token_id
          ? poolsByAddressToken.get(poolKey(counterpartyLower, entry.token_id))
          : undefined
      if (matched) return { kind: 'earnDeposit', pool: matched }
      if (isSwapLpAddress(counterpartyLower)) return { kind: 'swap' }
      return { kind: 'transfer' }
    }
    case 'transferBalanceIn': {
      // Counterparty here is the sender. A pool address means an earn payout.
      const matched =
        counterpartyLower && entry.token_id
          ? poolsByAddressToken.get(poolKey(counterpartyLower, entry.token_id))
          : undefined
      if (matched) return { kind: 'earnWithdraw', pool: matched }
      if (isSwapLpAddress(counterpartyLower)) return { kind: 'swap' }
      return { kind: 'transfer' }
    }
    default:
      return { kind: 'unknown' }
  }
}
