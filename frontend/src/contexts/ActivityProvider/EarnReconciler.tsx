import { useEffect, useRef } from 'react'
import { useUnsettledOperations, type UnsettledOperation } from '@/api/operations'
import { isSettledFailure } from '@/api/operation-status'
import { useActivity } from './useActivity'
import type { Activity, ActivityStatus, EarnActivity } from './context'

const statusOf = (op: UnsettledOperation): ActivityStatus =>
  isSettledFailure(op.status) ? 'failed' : 'in-progress'

// Earn ops carry no quote id, so an entry created before the response arrived
// is matched the way history is: same pool, token and amount, recorded no
// earlier than the local entry. Seconds of skew cover the clock difference
// between the browser and the backend.
const SKEW_SECONDS = 60

const keyOf = (direction: 'deposit' | 'withdraw', poolId: string, tokenId: string, amount: string) =>
  `${direction}|${poolId}|${tokenId}|${amount}`

const opKey = (op: UnsettledOperation): string | null => {
  if (op.operation_type !== 'earn_deposit' && op.operation_type !== 'earn_withdraw') return null
  if (op.pool_id == null || op.token_id == null || op.amount == null) return null
  return keyOf(
    op.operation_type === 'earn_deposit' ? 'deposit' : 'withdraw',
    op.pool_id,
    op.token_id,
    op.amount,
  )
}

const isEarn = (a: Activity): a is EarnActivity => a.type === 'earn'

// Patches local earn entries with the server's outcome. The optimistic entry is
// the only thing the earn result screen reads, and a deposit or withdraw whose
// response never arrived — a gateway hanging up on a slow pool, say — would
// otherwise sit on "Moving to Earn…" for the rest of the session even though it
// settled. Mirrors SwapReconciler; runs app-wide so the entry is corrected
// whichever screen the user is on.
export const EarnReconciler = () => {
  const { data } = useUnsettledOperations()
  const { activities, updateActivity } = useActivity()
  // Ids of entries this reconciler has seen listed by the server. An op that
  // was in the feed and then left has settled — failed ops stay listed, so
  // leaving can only mean completion. Keyed by activity, not by pool/amount,
  // so two identical deposits never resolve each other.
  const seenRef = useRef(new Set<string>())

  useEffect(() => {
    if (!data) return

    // Same pool, token and amount is not unique, so pair one op to one entry
    // rather than letting every matching entry bind to the same operation.
    const opsByKey = new Map<string, UnsettledOperation[]>()
    for (const op of data.operations) {
      const k = opKey(op)
      if (k == null) continue
      const bucket = opsByKey.get(k)
      if (bucket) bucket.push(op)
      else opsByKey.set(k, [op])
    }

    // Terminal entries are left alone; only something still settling can move.
    const pending = activities
      .filter(isEarn)
      .filter(a => a.status === 'in-progress')
      .sort((a, b) => a.createdAt - b.createdAt)

    for (const activity of pending) {
      const k = keyOf(activity.direction, activity.poolId, activity.token.id, activity.amount)
      const bucket = opsByKey.get(k)
      const createdAtSec = Math.floor(activity.createdAt / 1000)
      const index = bucket?.findIndex(op => op.created_at + SKEW_SECONDS >= createdAtSec) ?? -1

      if (bucket && index >= 0) {
        const [op] = bucket.splice(index, 1)
        seenRef.current.add(activity.id)
        const status = statusOf(op)
        const serverId = activity.direction === 'deposit' ? activity.depositId : activity.withdrawId
        if (
          activity.status !== status ||
          serverId !== op.operation_id ||
          (op.error ?? undefined) !== activity.error
        ) {
          updateActivity(activity.id, {
            status,
            ...(activity.direction === 'deposit'
              ? { depositId: op.operation_id }
              : { withdrawId: op.operation_id }),
            txHash: op.tx_hash ?? undefined,
            error: op.error ?? undefined,
          })
        }
      } else if (seenRef.current.has(activity.id)) {
        updateActivity(activity.id, { status: 'completed' })
      }
    }
  }, [data, activities, updateActivity])

  return null
}
