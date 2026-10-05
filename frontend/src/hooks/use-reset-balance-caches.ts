import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useConnection } from 'wagmi'
import { earnKeys } from '@/api/earn'
import { historyKeys } from '@/api/portfolio'

const balanceKeys = (address: string | undefined) => [
  ['accounting-balance'],
  ['accounting-batch-balances'],
  ...(address ? [earnKeys.balance(address)] : []),
]

export const useResetBalanceCaches = () => {
  const queryClient = useQueryClient()
  const { address } = useConnection()
  return useCallback(() => {
    for (const queryKey of balanceKeys(address)) void queryClient.resetQueries({ queryKey })
    // History and pool totals moved too, but they are slow and a chart already
    // ends on the live balance: refresh them in the background, keeping the old data.
    void queryClient.invalidateQueries({ queryKey: historyKeys.all })
    void queryClient.invalidateQueries({ queryKey: earnKeys.pools() })
  }, [queryClient, address])
}

/**
 * Refetches balances while the old figures stay on screen, so the dashboard
 * updates in place instead of blanking. Only for money arriving or moving
 * within the account (swap, earn); money leaving it resets.
 */
export const useRefreshBalanceCaches = () => {
  const queryClient = useQueryClient()
  const { address } = useConnection()
  return useCallback(() => {
    for (const queryKey of balanceKeys(address)) void queryClient.invalidateQueries({ queryKey })
    // Activity rows: the SDK refetches them after its own withdrawals, not after a credit.
    void queryClient.invalidateQueries({ queryKey: ['accounting-history'] })
    void queryClient.invalidateQueries({ queryKey: historyKeys.all })
    void queryClient.invalidateQueries({ queryKey: earnKeys.pools() })
  }, [queryClient, address])
}
