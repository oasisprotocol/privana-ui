import { useEffect } from 'react'
import { useSwapStatus } from '@/api/swap'
import { useActivity } from './useActivity'
import type { SwapActivity, SwapActivityStatus } from './context'

// Backend status string isn't an enum on the API side; map loosely into the
// three states the UI cares about. Unknown/intermediate values stay in-progress.
const mapBackendStatus = (status: string): SwapActivityStatus => {
  const s = status.toLowerCase()
  if (['completed', 'success', 'executed', 'filled', 'settled'].includes(s)) return 'completed'
  if (['failed', 'error', 'rejected', 'cancelled'].includes(s)) return 'failed'
  return 'in-progress'
}

type Props = { activity: SwapActivity & { swapId: string } }

export const SwapStatusPoller = ({ activity }: Props) => {
  const { updateActivity } = useActivity()
  const { data } = useSwapStatus(activity.swapId)

  useEffect(() => {
    if (!data) return
    const nextStatus = mapBackendStatus(data.status)
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
