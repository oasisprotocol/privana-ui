import { useEffect, useRef } from 'react'
import { isInFlight, useOperations, type OperationStatus } from '@/api/operations'
import type { Activity } from '@/contexts/ActivityProvider/context'
import { useResetBalanceCaches } from './use-reset-balance-caches'

const CLOCK_SKEW_SECONDS = 60

type Seen = { since: number; statuses: Map<string, OperationStatus> }

export function useResetOnSettle(activities: readonly Activity[]) {
  const operations = useOperations(activities)
  const resetBalanceCaches = useResetBalanceCaches()
  const seenRef = useRef<Seen | null>(null)
  const ops = operations.data?.operations

  useEffect(() => {
    if (!ops) return
    const seen = seenRef.current
    if (!seen) {
      seenRef.current = {
        since: Math.floor(Date.now() / 1000) - CLOCK_SKEW_SECONDS,
        statuses: new Map(ops.map(o => [o.operation_id, o.status])),
      }
      return
    }
    let settled = false
    for (const op of ops) {
      const previous = seen.statuses.get(op.operation_id)
      const wasOpen = previous !== undefined ? isInFlight(previous) : op.created_at >= seen.since
      if (wasOpen && !isInFlight(op.status)) settled = true
      seen.statuses.set(op.operation_id, op.status)
    }
    if (settled) resetBalanceCaches()
  }, [ops, resetBalanceCaches])
}
