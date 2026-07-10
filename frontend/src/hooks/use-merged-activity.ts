import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useHistory, type HistoryEntry } from '@oasisprotocol/privana-sdk'
import { useEarnPools, type EarnPool } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { useUnsettledOperations, type UnsettledOperation } from '@/api/operations'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import type { Activity, ActivityStatus, ActivityTokenInfo } from '@/contexts/ActivityProvider/context'
import {
  classifyHistory,
  matchesLocal,
  type ClassifiedHistoryEntry,
  type HistoryWindow,
} from '@/pages/Activity/historyMapping'

export type MergedRow =
  | { source: 'chain'; timestamp: number; row: ClassifiedHistoryEntry }
  | { source: 'local'; timestamp: number; activity: Activity }

export const rowKey = (r: MergedRow): string =>
  r.source === 'local' ? `local:${r.activity.id}` : `chain:${r.row.index}`

export interface UseMergedActivityResult {
  rows: MergedRow[]
  isLoading: boolean
  isError: boolean
}

// Shows the newest HISTORY_PAGE_SIZE entries; older ones aren't reachable yet.
// TODO: paginate once users routinely exceed this window.
const HISTORY_PAGE_SIZE = 100

const mapStatus = (s: UnsettledOperation['status']): ActivityStatus =>
  s === 'pending' ? 'in-progress' : 'failed'

const serverIdOf = (a: Activity): string | undefined =>
  a.type === 'swap' ? a.swapId : a.direction === 'deposit' ? a.depositId : a.withdrawId

// The server now owns this operation, so its optimistic copy is a duplicate.
const isAdoptedByServer = (a: Activity, unsettledIds: ReadonlySet<string>): boolean => {
  const sid = serverIdOf(a)
  return sid != null && unsettledIds.has(sid)
}

// The single definition of an in-flight local activity. The badge counts these
// and the list renders these; routing both through one predicate is what keeps
// them from drifting apart.
const pendingLocal = (activities: Activity[], unsettledIds: ReadonlySet<string>): Activity[] =>
  activities.filter(a => a.status === 'in-progress' && !isAdoptedByServer(a, unsettledIds))

export function mapOperationToActivity(
  op: UnsettledOperation,
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
      txHash: op.tx_hash ?? undefined,
      error: op.error ?? undefined,
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
    token: resolveToken(op.token_id),
    amount: op.amount ?? '0',
    poolId: op.pool_id ?? '',
    protocol: pool?.strategy ?? '',
    ...(direction === 'deposit' ? { depositId: op.operation_id } : { withdrawId: op.operation_id }),
    txHash: op.tx_hash ?? undefined,
    error: op.error ?? undefined,
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
// offset, so the short page lands at the newest end: with 101 entries and a page
// size of 100, page -1 holds a single row. Past one page we always pull the page
// behind it too and keep the newest HISTORY_PAGE_SIZE of the pair, plus the one
// entry before them so classifyHistory can spot a swap the window cut through.
function useLatestHistory(): LatestHistoryResult {
  const newest = useHistory({ offset: -1, limit: HISTORY_PAGE_SIZE })
  const total = newest.total
  const needsPrior = total > HISTORY_PAGE_SIZE
  const prior = useHistory({ offset: -2, limit: HISTORY_PAGE_SIZE, enabled: needsPrior })

  // Pages are ascending (oldest first), so the tail of the pair is the newest window.
  const { entries, leadIn } = useMemo(() => {
    if (!needsPrior) return { entries: newest.history, leadIn: undefined }
    // Past one page, the newest page alone is the *short* one — a single row at
    // 101 entries. Publishing it while its companion is still in flight hands a
    // consumer a plausible-looking one-row list, so withhold the window until
    // the pair is whole rather than trusting every caller to check isLoading.
    if (prior.history.length === 0) return { entries: [], leadIn: undefined }
    const combined = [...prior.history, ...newest.history]
    return {
      entries: combined.slice(-HISTORY_PAGE_SIZE),
      leadIn: combined[combined.length - HISTORY_PAGE_SIZE - 1],
    }
  }, [needsPrior, prior.history, newest.history])

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
    isError: newest.isError || (needsPrior && prior.isError),
    refetch,
  }
}

export function useMergedActivity(): UseMergedActivityResult {
  const history = useLatestHistory()
  const { data: poolsData, isLoading: poolsLoading, isError: poolsError } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading } = useTokens()
  const unsettled = useUnsettledOperations()
  const { activities, removeActivity } = useActivity()

  const poolsByAddress = useMemo(() => {
    const map = new Map<string, EarnPool>()
    for (const p of poolsData?.pools ?? []) map.set(p.pool_address.toLowerCase(), p)
    return map
  }, [poolsData])

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

  const historyWindow = history.window
  const chainRows = useMemo(
    () => classifyHistory(history.entries, poolsByAddress, historyWindow),
    [history.entries, poolsByAddress, historyWindow],
  )

  const unsettledOps = useMemo(() => unsettled.data?.operations ?? [], [unsettled.data])

  const unsettledIds = useMemo(() => new Set(unsettledOps.map(o => o.operation_id)), [unsettledOps])

  const refetchHistory = history.refetch
  const prevUnsettledIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!unsettled.data) {
      prevUnsettledIdsRef.current = new Set()
      return
    }
    const prev = prevUnsettledIdsRef.current
    let settled = false
    for (const id of prev) {
      if (!unsettledIds.has(id)) {
        settled = true
        break
      }
    }
    prevUnsettledIdsRef.current = unsettledIds
    if (settled) void refetchHistory()
  }, [unsettled.data, unsettledIds, refetchHistory])

  const unsettledRows = useMemo<Activity[]>(() => {
    const resolveToken = (id: string | null): ActivityTokenInfo =>
      (id ? tokensById.get(id) : undefined) ?? { id: id ?? '', symbol: '', decimals: 0 }
    const resolvePool = (poolId: string | null) => (poolId ? poolsById.get(poolId) : undefined)
    return unsettledOps.map(op => mapOperationToActivity(op, resolveToken, resolvePool))
  }, [unsettledOps, tokensById, poolsById])

  const isSupersededOptimistic = useCallback(
    (a: Activity): boolean =>
      isAdoptedByServer(a, unsettledIds) ||
      (a.status === 'completed' && chainRows.some(r => matchesLocal(r, a))),
    [unsettledIds, chainRows],
  )

  const visibleOptimistic = useMemo(
    () => activities.filter(a => !isSupersededOptimistic(a)),
    [activities, isSupersededOptimistic],
  )

  useEffect(() => {
    for (const a of activities) {
      if (isSupersededOptimistic(a)) removeActivity(a.id)
    }
  }, [activities, isSupersededOptimistic, removeActivity])

  const rows = useMemo<MergedRow[]>(() => {
    const merged: MergedRow[] = chainRows.map(row => ({
      source: 'chain' as const,
      timestamp: row.timestamp,
      row,
    }))

    for (const a of [...unsettledRows, ...visibleOptimistic]) {
      // Activity.createdAt is ms; HistoryEntry.timestamp is seconds.
      merged.push({ source: 'local', timestamp: Math.floor(a.createdAt / 1000), activity: a })
    }
    merged.sort((a, b) => b.timestamp - a.timestamp)
    return merged
  }, [chainRows, unsettledRows, visibleOptimistic])

  return {
    rows,
    isLoading: history.isLoading || poolsLoading || tokensLoading || unsettled.isLoading,
    isError: history.isError || !!poolsError,
  }
}

// Counts exactly the rows useMergedActivity would render as in-progress: the
// server's pending operations, plus the local activities it hasn't adopted yet.
export function usePendingActivityCount(): number {
  const unsettled = useUnsettledOperations()
  const { activities } = useActivity()
  const ops = unsettled.data?.operations ?? []
  const unsettledIds = new Set(ops.map(o => o.operation_id))
  const serverPending = ops.filter(o => o.status === 'pending').length
  return serverPending + pendingLocal(activities, unsettledIds).length
}
