import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { useEarnBalance, useEarnPools } from '@/api/earn'
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
  const { data: balanceData, isLoading: balanceLoading } = useEarnBalance()
  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()
  const { getTokenById } = usePrivanaContext()

  const isLoading = balanceLoading || poolsLoading

  const positions = balanceData?.positions ?? []
  const pools = poolsData?.pools ?? []
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
      const token = getTokenById(pool ? pool.token_id : pos.token_id)
      const decimals = token?.decimals
      return {
        poolId: pos.pool_id,
        name: pool ? (STRATEGY_LABELS[pool.strategy] ?? pool.strategy) : pos.pool_id,
        earning:
          decimals != null
            ? `${formatAmount(BigInt(pos.underlying_amount), decimals)} ${token?.symbol ?? ''}`
            : '-',
        apyBps: pool ? pool.apy_bps : null,
        asset: token?.symbol ?? '—',
        strategyKey: pool?.strategy ?? null,
      }
    })

  return { strategies, isLoading }
}
