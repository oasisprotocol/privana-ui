import { useMemo } from 'react'
import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { useEarnPools } from '@/api/earn'
import { SWAP_LP_ADDRESS } from '@/config/swap'
import { SERVICE_CONTRACTS } from '@/config/systemAddresses'

export function useSystemAddresses(): string[] {
  const { networkConfig } = usePrivanaContext()
  const { data: poolsData } = useEarnPools()

  return useMemo(
    () =>
      [
        networkConfig.accountingContract,
        SWAP_LP_ADDRESS,
        ...SERVICE_CONTRACTS,
        ...(poolsData?.pools ?? []).map(pool => pool.pool_address),
      ]
        .filter(Boolean)
        .map(address => address.toLowerCase()),
    [networkConfig.accountingContract, poolsData],
  )
}
