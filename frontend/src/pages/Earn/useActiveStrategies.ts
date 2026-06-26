import { useEarnBalance, useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { formatAmount } from '@/lib/tokens'

export type ActiveStrategy = {
  poolId: string
  /** Formatted underlying amount + symbol, e.g. "200.00 USDC". */
  earning: string
}

export const useActiveStrategies = (): { strategies: ActiveStrategy[]; isLoading: boolean } => {
  const { data: balanceData, isLoading: balanceLoading } = useEarnBalance()
  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading } = useTokens()

  const isLoading = balanceLoading || poolsLoading || tokensLoading

  const positions = balanceData?.positions ?? []
  const tokensById = new Map((tokensData?.tokens ?? []).map(t => [t.token_id, t]))
  const poolsById = new Map((poolsData?.pools ?? []).map(p => [p.pool_id, p]))

  const strategies = positions
    .filter(p => {
      try {
        return BigInt(p.shares ?? '0') > 0n
      } catch {
        return false
      }
    })
    .map(pos => {
      const pool = poolsById.get(pos.pool_id)
      const token = pool ? tokensById.get(pool.token_id) : tokensById.get(pos.token_id)
      const decimals = token?.token_decimals
      return {
        poolId: pos.pool_id,
        earning:
          decimals != null
            ? `${formatAmount(BigInt(pos.underlying_amount), decimals)} ${token?.token_symbol ?? ''}`
            : '-',
      }
    })

  return { strategies, isLoading }
}
