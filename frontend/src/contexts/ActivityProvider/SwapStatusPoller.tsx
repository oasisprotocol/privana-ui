import { useEffect } from 'react'
import { useSwapStatus } from '@/api/swap'
import { useActivity } from './useActivity'
import type { ActivityStatus, SwapActivity } from './context'

type Props = { activity: SwapActivity & { swapId: string } }

export const SwapStatusPoller = ({ activity }: Props) => {
  const { updateActivity } = useActivity()
  const { data } = useSwapStatus(activity.swapId)

  useEffect(() => {
    if (!data) return
    const nextStatus: ActivityStatus =
      data.status === 'completed' || data.status === 'failed' ? data.status : 'in-progress'
    const nextTxHash = data.swap_tx_hash ?? undefined
    const nextError = data.error ?? undefined

    const patch: Partial<SwapActivity> = {}
    if (nextStatus !== activity.status) patch.status = nextStatus
    if (nextTxHash != null && nextTxHash !== activity.txHash) patch.txHash = nextTxHash
    if (nextError && nextError !== activity.error) patch.error = nextError

    if (Object.keys(patch).length > 0) {
      updateActivity(activity.id, patch)
    }
  }, [data, activity.id, activity.status, activity.txHash, activity.error, updateActivity])

  return null
}
