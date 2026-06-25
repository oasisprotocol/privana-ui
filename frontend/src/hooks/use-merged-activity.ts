import { useEffect, useMemo } from 'react'
import { useHistory } from '@oasisprotocol/privana-sdk'
import { useEarnPools, type EarnPool } from '@/api/earn'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import type { Activity } from '@/contexts/ActivityProvider/context'
import { classifyHistory, matchesLocal, type ClassifiedHistoryEntry } from '@/pages/Activity/historyMapping'

export type MergedRow =
  | { source: 'chain'; timestamp: number; row: ClassifiedHistoryEntry }
  | { source: 'local'; timestamp: number; activity: Activity }

export interface UseMergedActivityResult {
  rows: MergedRow[]
  isLoading: boolean
  isError: boolean
}

// Fetches just the most recent page of history. The contract supports paging
// via offset/limit (per-call max ~100);
// TODO: add multi-page assembly if/when user regularly exceed this window.
const HISTORY_PAGE_SIZE = 100

export function useMergedActivity(): UseMergedActivityResult {
  const history = useHistory({ offset: -1, limit: HISTORY_PAGE_SIZE })
  const { data: poolsData, isLoading: poolsLoading, isError: poolsError } = useEarnPools()
  const { activities, removeActivity } = useActivity()

  const poolsByAddress = useMemo(() => {
    const map = new Map<string, EarnPool>()
    for (const p of poolsData?.pools ?? []) {
      map.set(p.pool_address.toLowerCase(), p)
    }
    return map
  }, [poolsData])

  const chainRows = useMemo(
    () => classifyHistory(history.history, poolsByAddress),
    [history.history, poolsByAddress],
  )

  const matchedLocalIds = useMemo(() => {
    const ids = new Set<string>()
    const consumedChain = new Set<number>()
    for (const local of activities) {
      for (let i = 0; i < chainRows.length; i++) {
        if (consumedChain.has(i)) continue
        if (matchesLocal(chainRows[i], local)) {
          consumedChain.add(i)
          ids.add(local.id)
          break
        }
      }
    }
    return ids
  }, [chainRows, activities])

  // Prune local copies once they've settled AND their chain entry is visible.
  useEffect(() => {
    for (const local of activities) {
      if (local.status !== 'completed') continue
      if (matchedLocalIds.has(local.id)) removeActivity(local.id)
    }
  }, [activities, matchedLocalIds, removeActivity])

  const rows = useMemo<MergedRow[]>(() => {
    const merged: MergedRow[] = chainRows.map(row => ({
      source: 'chain' as const,
      timestamp: row.timestamp,
      row,
    }))
    // Hold back local (optimistic localStorage) rows until backend history has
    // loaded. Otherwise a lone pending item flashes on its own before the full
    // list arrives — and before we can dedupe it against its settled chain entry.
    if (!history.isLoading) {
      for (const a of activities) {
        if (matchedLocalIds.has(a.id)) continue
        // Activity.createdAt is ms; HistoryEntry.timestamp is seconds.
        merged.push({ source: 'local', timestamp: Math.floor(a.createdAt / 1000), activity: a })
      }
    }
    merged.sort((a, b) => b.timestamp - a.timestamp)
    return merged
  }, [chainRows, activities, matchedLocalIds, history.isLoading])

  return {
    rows,
    isLoading: history.isLoading || poolsLoading,
    isError: history.isError || !!poolsError,
  }
}
