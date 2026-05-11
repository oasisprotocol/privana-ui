import { useAccount } from 'wagmi'
import { useEarnBalance, useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { formatAmount } from '@/lib/tokens'
import { STRATEGY_LABELS } from './labels'

export type ActiveStrategy = {
  poolId: string
  name: string
  earning: string
  apyBps: number | null
  asset: string
  strategyKey: string | null
}

export const useActiveStrategies = (): { strategies: ActiveStrategy[]; isLoading: boolean } => {
  const { address } = useAccount()
  const { data: balanceData, isLoading: balanceLoading } = useEarnBalance(address)
  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading } = useTokens()

  const isLoading = balanceLoading || poolsLoading || tokensLoading

  const positions = balanceData?.positions ?? []
  const pools = poolsData?.pools ?? []
  const tokensById = new Map((tokensData?.tokens ?? []).map(t => [t.token_id, t]))
  const poolsById = new Map(pools.map(p => [p.pool_id, p]))

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
        name: pool ? (STRATEGY_LABELS[pool.strategy] ?? pool.strategy) : pos.pool_id,
        earning:
          decimals != null
            ? `${formatAmount(BigInt(pos.underlying_amount), decimals)} ${token?.token_symbol ?? ''}`
            : '-',
        apyBps: pool ? pool.apy_bps : null,
        asset: token?.token_symbol ?? '—',
        strategyKey: pool?.strategy ?? null,
      }
    })

  return { strategies, isLoading }
}
