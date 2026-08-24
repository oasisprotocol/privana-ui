import { useQueryClient } from '@tanstack/react-query'
import { useConnection } from 'wagmi'
import { earnKeys } from '@/api/earn'
import { historyKeys } from '@/api/portfolio'

export const useResetBalanceCaches = () => {
  const queryClient = useQueryClient()
  const { address } = useConnection()
  return () => {
    queryClient.removeQueries({ queryKey: ['accounting-balance'] })
    queryClient.removeQueries({ queryKey: ['accounting-batch-balances'] })
    queryClient.removeQueries({ queryKey: historyKeys.all })
    if (address) queryClient.removeQueries({ queryKey: earnKeys.balance(address) })
  }
}
