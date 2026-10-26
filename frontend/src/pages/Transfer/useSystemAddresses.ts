import { useMemo } from 'react'
import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { useEarnPools } from '@/api/earn'
import { SWAP_LP_ADDRESS } from '@/config/swap'

export function useSystemAddresses(): { addresses: string[]; ready: boolean } {
  const { networkConfig } = usePrivanaContext()
  const { data: poolsData, isError: poolsError } = useEarnPools()

  const addresses = useMemo(
    () =>
      [
        networkConfig.accountingContract,
        SWAP_LP_ADDRESS,
        import.meta.env.VITE_SWAP_MANAGER_CONTRACT_ADDRESS,
        import.meta.env.VITE_EARN_MANAGER_CONTRACT_ADDRESS,
        ...(poolsData?.pools ?? []).map(pool => pool.pool_address),
      ]
        .filter(Boolean)
        .map(address => address.toLowerCase()),
    [networkConfig.accountingContract, poolsData],
  )

  // Pool addresses arrive with the pools request; if it fails, the fixed addresses still apply.
  return { addresses, ready: !!poolsData || poolsError }
}
