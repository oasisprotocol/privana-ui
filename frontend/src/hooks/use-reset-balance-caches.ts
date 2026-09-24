import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useConnection } from 'wagmi'
import { earnKeys } from '@/api/earn'
import { historyKeys } from '@/api/portfolio'

export const useResetBalanceCaches = () => {
  const queryClient = useQueryClient()
  const { address } = useConnection()
  return useCallback(() => {
    void queryClient.resetQueries({ queryKey: ['accounting-balance'] })
    void queryClient.resetQueries({ queryKey: ['accounting-batch-balances'] })
    if (address) void queryClient.resetQueries({ queryKey: earnKeys.balance(address) })
    // History and pool totals moved too, but they are slow and a chart already
    // ends on the live balance: refresh them in the background, keeping the old data.
    void queryClient.invalidateQueries({ queryKey: historyKeys.all })
    void queryClient.invalidateQueries({ queryKey: earnKeys.pools() })
  }, [queryClient, address])
}
