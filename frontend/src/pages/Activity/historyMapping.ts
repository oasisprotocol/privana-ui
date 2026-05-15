import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import type { EarnPool } from '@/api/earn'
import type { Activity } from '@/contexts/ActivityProvider/context'
import { isSwapLpAddress } from '@/config/swap'

export type DisplayKind =
  | 'swap'
  | 'earnDeposit'
  | 'deposit'
  | 'withdraw'
  | 'lock'
  | 'reclaim'
  | 'transfer'
  | 'unknown'

// Kinds whose chain entries are self-contained are self-contained. Swap output & earn withdraws
// live in the LP/pool's history so their local copies must stay until backend is tweaked
export const PRUNE_ELIGIBLE: ReadonlySet<DisplayKind> = new Set(['deposit', 'withdraw', 'earnDeposit'])

export type ClassifiedHistoryEntry = {
  source: 'chain'
  kind: DisplayKind
  timestamp: number
  tokenId: string | null
  amount: string | null
  counterparty: string | null
  pool: EarnPool | undefined
  entry: HistoryEntry
}

export function classify(entry: HistoryEntry, poolsByAddress: Map<string, EarnPool>): ClassifiedHistoryEntry {
  const counterpartyLower = entry.counterparty?.toLowerCase() ?? null
  const { kind, pool } = resolveKind(entry, counterpartyLower, poolsByAddress)

  return {
    source: 'chain',
    kind,
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
    case 'transferFromLock':
      return { kind: 'reclaim' }
    case 'transferBalance': {
      if (isSwapLpAddress(counterpartyLower)) return { kind: 'swap' }
      const matched = counterpartyLower ? poolsByAddress.get(counterpartyLower) : undefined
      if (matched) return { kind: 'earnDeposit', pool: matched }
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

  return false
}
