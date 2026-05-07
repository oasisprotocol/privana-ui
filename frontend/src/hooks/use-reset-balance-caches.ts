import { useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { earnKeys } from '@/api/earn'

export const useResetBalanceCaches = () => {
  const queryClient = useQueryClient()
  const { address } = useAccount()
  return () => {
    queryClient.removeQueries({ queryKey: ['accounting-balance'] })
    queryClient.removeQueries({ queryKey: ['accounting-batch-balances'] })
    if (address) queryClient.removeQueries({ queryKey: earnKeys.balance(address) })
  }
}
