import { useEffect, useRef, useState } from 'react'
import { isInFlight, useOperations, type OperationStatus } from '@/api/operations'
import type { Activity } from '@/contexts/ActivityProvider/context'
import { useResetBalanceCaches } from './use-reset-balance-caches'

const CLOCK_SKEW_SECONDS = 60

// An undeployed earn deposit has already minted its shares; it stays in flight only for the redeploy.
const balanceMoved = (status: OperationStatus) => !isInFlight(status) || status === 'undeployed'

export function useResetOnSettle(activities: readonly Activity[]) {
  const operations = useOperations(activities)
  const resetBalanceCaches = useResetBalanceCaches()
  const [since] = useState(() => Math.floor(Date.now() / 1000) - CLOCK_SKEW_SECONDS)
  const statusesRef = useRef(new Map<string, OperationStatus>())
  const ops = operations.data?.operations

  useEffect(() => {
    if (!ops) return
    const statuses = statusesRef.current
    let moved = false
    for (const op of ops) {
      const previous = statuses.get(op.operation_id)
      const wasPending = previous !== undefined ? !balanceMoved(previous) : op.updated_at >= since
      if (wasPending && balanceMoved(op.status)) moved = true
      statuses.set(op.operation_id, op.status)
    }
    if (moved) resetBalanceCaches()
  }, [ops, since, resetBalanceCaches])
}
