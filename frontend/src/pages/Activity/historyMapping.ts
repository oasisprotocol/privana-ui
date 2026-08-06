import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import type { EarnPool } from '@/api/earn'
import type { Activity } from '@/contexts/ActivityProvider/context'
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

// Kinds where the chain entry alone is enough to drop the local copy.
export const PRUNE_ELIGIBLE: ReadonlySet<DisplayKind> = new Set([
  'deposit',
  'withdraw',
  'earnDeposit',
  'earnWithdraw',
  'swap',
])

export const HIDDEN_KINDS: ReadonlySet<DisplayKind> = new Set(['reclaimOut', 'reclaimIn', 'unknown'])

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
  poolsByAddress: Map<string, EarnPool>,
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

    rows.push(classify(entry, index, poolsByAddress))
  }

  return rows
}

function classify(
  entry: HistoryEntry,
  index: number,
  poolsByAddress: Map<string, EarnPool>,
): ClassifiedHistoryEntry {
  const counterpartyLower = entry.counterparty?.toLowerCase() ?? null
  const { kind, pool } = resolveKind(entry, counterpartyLower, poolsByAddress)

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
  poolsByAddress: Map<string, EarnPool>,
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
      const matched = counterpartyLower ? poolsByAddress.get(counterpartyLower) : undefined
      if (matched) return { kind: 'earnDeposit', pool: matched }
      if (isSwapLpAddress(counterpartyLower)) return { kind: 'swap' }
      return { kind: 'transfer' }
    }
    case 'transferBalanceIn': {
      // Counterparty here is the sender. A pool address means an earn payout.
      const matched = counterpartyLower ? poolsByAddress.get(counterpartyLower) : undefined
      if (matched) return { kind: 'earnWithdraw', pool: matched }
      return { kind: 'transfer' }
    }
    default:
      return { kind: 'unknown' }
  }
}

// Match between a chain row and a local activity for prune effect.
// Only called for kinds in PRUNE_ELIGIBLE - for everything else the
// local copy is the only record we have and must stay.
export function matchesLocal(row: ClassifiedHistoryEntry, local: Activity, skewSeconds = 60): boolean {
  if (!PRUNE_ELIGIBLE.has(row.kind)) return false

  // HistoryEntry timestamp is seconds; local createdAt is ms.
  const createdAtSec = Math.floor(local.createdAt / 1000)
  if (row.timestamp + skewSeconds < createdAtSec) return false

  if (row.kind === 'earnDeposit' && local.type === 'earn' && local.direction === 'deposit') {
    return row.pool?.pool_id === local.poolId && row.tokenId === local.token.id && row.amount === local.amount
  }

  if (row.kind === 'earnWithdraw' && local.type === 'earn' && local.direction === 'withdraw') {
    return row.pool?.pool_id === local.poolId && row.tokenId === local.token.id && row.amount === local.amount
  }

  if (row.kind === 'swap' && local.type === 'swap') {
    return row.tokenId === local.fromToken.id && row.amount === local.fromAmount
  }

  return false
}
