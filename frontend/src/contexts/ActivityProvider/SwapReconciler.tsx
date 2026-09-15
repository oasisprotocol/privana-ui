import { useEffect, useRef } from 'react'
import { useUnsettledOperations, type UnsettledOperation } from '@/api/operations'
import { isSettledFailure, type UnsettledOperationStatus } from '@/api/operation-status'
import { useActivity } from './useActivity'
import type { ActivityStatus } from './context'

const statusOf = (op: UnsettledOperation): ActivityStatus =>
  isSettledFailure(op.status) ? 'failed' : 'in-progress'

// Patches local swap entries with the server's outcome, keyed by quote id.
// The optimistic entry is the only thing the swap result screen reads, and a
// timed-out execute response never updates it — without this, a recovered swap
// shows "Swapping…" forever. Runs app-wide so the entry is corrected no matter
// which screen the user is on.
export const SwapReconciler = () => {
  const { data } = useUnsettledOperations()
  const { activities, updateActivity } = useActivity()
  // Last observed feed status per quote. Failed rows stay in the feed, so a
  // quote that was present and then left settled — as completed, unless it was
  // last seen refunding, in which case leaving means refunded (not completed).
  const seenQuotesRef = useRef(new Map<string, UnsettledOperationStatus>())

  useEffect(() => {
    if (!data) return
    const opByQuote = new Map(
      data.operations
        .filter(op => op.operation_type === 'swap' && op.quote_id != null)
        .map(op => [op.quote_id as string, op]),
    )
    for (const activity of activities) {
      if (activity.type !== 'swap' || activity.quoteId == null) continue
      const op = opByQuote.get(activity.quoteId)
      if (op) {
        seenQuotesRef.current.set(activity.quoteId, op.status)
        const status = statusOf(op)
        if (
          activity.status !== status ||
          activity.swapId !== op.operation_id ||
          (op.error ?? undefined) !== activity.error
        ) {
          updateActivity(activity.id, {
            status,
            swapId: op.operation_id,
            txHash: op.tx_hash ?? undefined,
            error: op.error ?? undefined,
          })
        }
      } else if (seenQuotesRef.current.has(activity.quoteId) && activity.status === 'in-progress') {
        const lastSeen = seenQuotesRef.current.get(activity.quoteId)
        updateActivity(
          activity.id,
          lastSeen === 'refunding' ? { status: 'failed', error: 'Swap refunded' } : { status: 'completed' },
        )
      }
    }
  }, [data, activities, updateActivity])

  return null
}
