import { useEffect, useMemo } from 'react'
import { useHistory } from '@oasisprotocol/privana-sdk'
import { useEarnPools, type EarnPool } from '@/api/earn'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import type { Activity } from '@/contexts/ActivityProvider/context'
import { classify, matchesLocal, type ClassifiedHistoryEntry } from '@/pages/Activity/historyMapping'

export type MergedRow =
  | { source: 'chain'; timestamp: number; row: ClassifiedHistoryEntry }
  | { source: 'local'; timestamp: number; activity: Activity }

export interface UseMergedActivityResult {
  rows: MergedRow[]
  isLoading: boolean
  isError: boolean
}

// Latest page of on-chain history (cap = 100 today, contract-side).
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
    () => history.history.map(e => classify(e, poolsByAddress)),
    [history.history, poolsByAddress],
  )

  const matchedLocalIds = useMemo(() => {
    const ids = new Set<string>()
    for (const row of chainRows) {
      for (const local of activities) {
        if (matchesLocal(row, local)) ids.add(local.id)
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
    for (const a of activities) {
      if (matchedLocalIds.has(a.id)) continue
      // Activity.createdAt is ms; HistoryEntry.timestamp is seconds.
      merged.push({ source: 'local', timestamp: Math.floor(a.createdAt / 1000), activity: a })
    }
    merged.sort((a, b) => b.timestamp - a.timestamp)
    return merged
  }, [chainRows, activities, matchedLocalIds])

  return {
    rows,
    isLoading: history.isLoading || poolsLoading,
    isError: history.isError || !!poolsError,
  }
}
