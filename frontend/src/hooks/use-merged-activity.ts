import { useCallback, useMemo } from 'react'
import { useHistory, type HistoryEntry } from '@oasisprotocol/privana-sdk'
import { useEarnPools, type EarnPool } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { serverOperationFor, useOperations, type Operation } from '@/api/operations'
import { isInFlight, isSettledFailure } from '@/api/operation-status'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import type { Activity, ActivityStatus, ActivityTokenInfo } from '@/contexts/ActivityProvider/context'
import {
  classifyHistory,
  HIDDEN_KINDS,
  type ClassifiedHistoryEntry,
  type HistoryWindow,
  indexPools,
} from '@/pages/Activity/historyMapping'

export type MergedRow =
  | { source: 'chain'; timestamp: number; row: ClassifiedHistoryEntry }
  | { source: 'local'; timestamp: number; activity: Activity }

export const rowKey = (r: MergedRow): string =>
  r.source === 'local' ? `local:${r.activity.id}` : `chain:${r.row.index}`

export interface UseMergedActivityResult {
  rows: MergedRow[]
  isLoading: boolean
  // A source failed; `rows` is then empty because the list is unknown, not because it is.
  isError: boolean
  refetch: () => void
}

// Shows the newest HISTORY_PAGE_SIZE entries; older ones aren't reachable yet.
// TODO: paginate once users routinely exceed this window.
const HISTORY_PAGE_SIZE = 100

const mapStatus = (s: Operation['status']): ActivityStatus =>
  s === 'completed' ? 'completed' : isSettledFailure(s) ? 'failed' : 'in-progress'

// A refund with no recorded reason still needs to read as a failure.
const errorOf = (op: Operation): string | undefined =>
  op.error ?? (op.status === 'refunded' ? 'Swap refunded' : undefined)

// A local entry with the server's outcome laid over it. Keeps the labels only the
// client knows (rate, fee, protocol) and takes status, ids and errors from the row.
export function resolveActivity(a: Activity, operations: readonly Operation[]): Activity {
  const op = serverOperationFor(a, operations)
  if (!op) return a
  const patch = {
    status: mapStatus(op.status),
    txHash: op.tx_hash ?? undefined,
    error: errorOf(op),
  }
  if (a.type === 'swap') {
    return { ...a, ...patch, swapId: op.operation_id, toAmount: op.to_amount_actual ?? a.toAmount }
  }
  return {
    ...a,
    ...patch,
    ...(a.direction === 'deposit' ? { depositId: op.operation_id } : { withdrawId: op.operation_id }),
  }
}

// The single definition of an in-flight local activity. The badge counts these
// and the list renders these; routing both through one predicate is what keeps
// them from drifting apart.
const pendingLocal = (activities: Activity[], operations: readonly Operation[]): Activity[] =>
  activities.filter(a => a.status === 'in-progress' && !serverOperationFor(a, operations))

export function mapOperationToActivity(
  op: Operation,
  resolveToken: (id: string | null) => ActivityTokenInfo,
  resolvePool: (poolId: string | null) => EarnPool | undefined,
): Activity {
  const status = mapStatus(op.status)
  const createdAt = op.created_at * 1000

  if (op.operation_type === 'swap') {
    return {
      id: op.operation_id,
      type: 'swap',
      status,
      createdAt,
      fromToken: resolveToken(op.from_token_id),
      toToken: resolveToken(op.to_token_id),
      fromAmount: op.from_amount ?? '0',
      toAmount: op.to_amount_actual ?? op.to_amount_estimate ?? '0',
      rateLabel: '',
      swapId: op.operation_id,
      quoteId: op.quote_id ?? undefined,
      txHash: op.tx_hash ?? undefined,
      error: errorOf(op),
    }
  }

  const direction = op.operation_type === 'earn_deposit' ? 'deposit' : 'withdraw'
  const pool = resolvePool(op.pool_id)
  return {
    id: op.operation_id,
    type: 'earn',
    direction,
    status,
    createdAt,
    token: resolveToken(op.token_id || pool?.token_id || null),
    amount: op.amount ?? '0',
    poolId: op.pool_id ?? '',
    protocol: pool?.strategy ?? '',
    ...(direction === 'deposit' ? { depositId: op.operation_id } : { withdrawId: op.operation_id }),
    txHash: op.tx_hash ?? undefined,
    error: errorOf(op),
  }
}

interface LatestHistoryResult {
  entries: HistoryEntry[]
  window: HistoryWindow
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

// Accounting's `offset` is a *page index* anchored to the oldest entry, not a row
// offset, so the short page lands at the newest end: with `limit + 1` entries,
// page -1 holds a single row. Past one page we always pull the page behind it too
// and keep the newest `limit` of the pair, plus the one entry before them so
// classifyHistory can spot a swap the window cut through.
function useLatestHistory(limit: number): LatestHistoryResult {
  const newest = useHistory({ offset: -1, limit })
  const total = newest.total
  const needsPrior = total > limit
  const prior = useHistory({ offset: -2, limit, enabled: needsPrior })

  // Pages are ascending (oldest first), so the tail of the pair is the newest window.
  const { entries, leadIn } = useMemo(() => {
    if (!needsPrior) return { entries: newest.history, leadIn: undefined }
    if (prior.history.length === 0) return { entries: [], leadIn: undefined }
    const combined = [...prior.history, ...newest.history]
    return {
      entries: combined.slice(-limit),
      leadIn: combined[combined.length - limit - 1],
    }
  }, [needsPrior, prior.history, newest.history, limit])

  const window = useMemo(
    () => ({ startIndex: Math.max(0, total - entries.length), leadIn }),
    [total, entries, leadIn],
  )

  const refetchNewest = newest.refetch
  const refetchPrior = prior.refetch
  const refetch = useCallback(() => {
    refetchNewest()
    if (needsPrior) refetchPrior()
  }, [refetchNewest, refetchPrior, needsPrior])

  return {
    entries,
    window,
    // Render the newest page only once its companion has landed, or the list
    // would flash a lone row before settling.
    isLoading: newest.isLoading || (needsPrior && prior.isLoading),
    // A failed background refetch keeps the cached pages, so only a failure
    // with nothing to show is an error.
    isError: (newest.isError || (needsPrior && prior.isError)) && entries.length === 0,
    refetch,
  }
}

export function useMergedActivity(historyLimit: number = HISTORY_PAGE_SIZE): UseMergedActivityResult {
  const history = useLatestHistory(historyLimit)
  const { data: poolsData, isLoading: poolsLoading, isError: poolsError } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading, isError: tokensError } = useTokens()
  const { activities } = useActivity()
  const operations = useOperations(activities)

  const poolsByAddressToken = useMemo(() => indexPools(poolsData?.pools ?? []), [poolsData])

  const poolsById = useMemo(() => {
    const map = new Map<string, EarnPool>()
    for (const p of poolsData?.pools ?? []) map.set(p.pool_id, p)
    return map
  }, [poolsData])

  const tokensById = useMemo(() => {
    const map = new Map<string, ActivityTokenInfo>()
    for (const t of tokensData?.tokens ?? []) {
      if (t.token_decimals == null) continue
      map.set(t.token_id, {
        id: t.token_id,
        symbol: t.token_symbol ?? t.token_type_name,
        decimals: t.token_decimals,
      })
    }
    return map
  }, [tokensData])

  const ops = useMemo(() => operations.data?.operations ?? [], [operations.data])

  const historyWindow = history.window
  const chainRows = useMemo(
    () =>
      classifyHistory(history.entries, poolsByAddressToken, historyWindow).filter(
        r => !HIDDEN_KINDS.has(r.kind),
      ),
    [history.entries, poolsByAddressToken, historyWindow],
  )

  const serverRows = useMemo<Activity[]>(() => {
    const resolveToken = (id: string | null): ActivityTokenInfo =>
      (id ? tokensById.get(id) : undefined) ?? { id: id ?? '', symbol: '', decimals: 0 }
    const resolvePool = (poolId: string | null) => (poolId ? poolsById.get(poolId) : undefined)
    return ops.map(op => mapOperationToActivity(op, resolveToken, resolvePool))
  }, [ops, tokensById, poolsById])

  // A local entry is only shown until the server lists its operation.
  const visibleOptimistic = useMemo(
    () => activities.filter(a => !serverOperationFor(a, ops)),
    [activities, ops],
  )

  const isLoading = history.isLoading || poolsLoading || tokensLoading || operations.isLoading
  // React Query flags a failed background refetch as an error while keeping the
  // cached data; with 10–20 s polling that must not blank a list we can still show.
  const isError =
    history.isError ||
    (!!poolsError && !poolsData) ||
    (!!tokensError && !tokensData) ||
    (operations.isError && !operations.data)

  const refetchHistory = history.refetch
  const refetchOperations = operations.refetch
  const refetch = useCallback(() => {
    refetchHistory()
    void refetchOperations()
  }, [refetchHistory, refetchOperations])

  const rows = useMemo<MergedRow[]>(() => {
    // The server rows land well before the chain history, so a partial merge
    // would show them on top and then reshuffle once history arrives. With a
    // source down the list is unknown; an empty list would read as "no history".
    if (isLoading || isError) return []

    const merged: MergedRow[] = chainRows.map(row => ({
      source: 'chain' as const,
      timestamp: row.timestamp,
      row,
    }))

    for (const a of [...serverRows, ...visibleOptimistic]) {
      // Activity.createdAt is ms; HistoryEntry.timestamp is seconds.
      merged.push({ source: 'local', timestamp: Math.floor(a.createdAt / 1000), activity: a })
    }
    merged.sort((a, b) => b.timestamp - a.timestamp)
    return merged
  }, [isLoading, isError, chainRows, serverRows, visibleOptimistic])

  return { rows, isLoading, isError, refetch }
}

// The local entry the result screens follow, with the server's outcome applied
// once the operation is listed.
export function useResolvedActivity(id: string | null): Activity | undefined {
  const { activities } = useActivity()
  const operations = useOperations(activities)
  const ops = operations.data?.operations
  const resolve = useCallback((a: Activity) => (ops ? resolveActivity(a, ops) : a), [ops])
  return useMemo(() => {
    if (!id) return undefined
    const local = activities.find(a => a.id === id)
    return local ? resolve(local) : undefined
  }, [id, activities, resolve])
}

// Counts exactly the rows useMergedActivity would render as in-progress: the
// server's in-flight operations, plus the local activities it hasn't listed yet.
export function usePendingActivityCount(): number {
  const { activities } = useActivity()
  const operations = useOperations(activities)
  const ops = operations.data?.operations ?? []
  const serverPending = ops.filter(o => isInFlight(o.status)).length
  return serverPending + pendingLocal(activities, ops).length
}
