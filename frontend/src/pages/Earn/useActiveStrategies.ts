import { useEarnBalance, useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { formatAmount } from '@/lib/tokens'

export type ActiveStrategy = {
  poolId: string
  /** Formatted underlying amount + symbol, e.g. "200.00 USDC". */
  earning: string
  /** Estimated daily accrual (position × APY / 365), formatted + symbol, or null. */
  earningToday: string | null
}

export type TokenAmount = { symbol: string; amount: bigint; decimals: number }

export const useActiveStrategies = (): {
  strategies: ActiveStrategy[]
  projectedMonthly: TokenAmount[]
  isLoading: boolean
} => {
  const { data: balanceData, isLoading: balanceLoading } = useEarnBalance()
  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading } = useTokens()

  const isLoading = balanceLoading || poolsLoading || tokensLoading

  const positions = balanceData?.positions ?? []
  const tokensById = new Map((tokensData?.tokens ?? []).map(t => [t.token_id, t]))
  const poolsById = new Map((poolsData?.pools ?? []).map(p => [p.pool_id, p]))

  const activePositions = positions.filter(p => {
    try {
      return BigInt(p.shares ?? '0') > 0n
    } catch {
      return false
    }
  })

  const strategies = activePositions.map(pos => {
    const pool = poolsById.get(pos.pool_id)
    const token = pool ? tokensById.get(pool.token_id) : tokensById.get(pos.token_id)
    const decimals = token?.token_decimals
    const symbol = token?.token_symbol ?? ''
    const underlying = BigInt(pos.underlying_amount)
    // Estimated daily accrual in base units: underlying × apy_bps / (10000 × 365).
    const apyBps = pool?.apy_bps ?? 0
    const todayRaw = apyBps > 0 ? (underlying * BigInt(apyBps)) / BigInt(10000 * 365) : 0n
    return {
      poolId: pos.pool_id,
      earning: decimals != null ? `${formatAmount(underlying, decimals)} ${symbol}` : '-',
      earningToday:
        decimals != null && todayRaw > 0n ? `${formatAmount(todayRaw, decimals)} ${symbol}` : null,
    }
  })

  // Per-token projected monthly rewards on the active positions:
  // underlying × apy_bps / (10000 × 12), aggregated by symbol so multiple pools
  // of the same token collapse into one figure.
  const projectedBySymbol = new Map<string, TokenAmount>()
  for (const pos of activePositions) {
    const pool = poolsById.get(pos.pool_id)
    const token = pool ? tokensById.get(pool.token_id) : tokensById.get(pos.token_id)
    const decimals = token?.token_decimals
    const symbol = token?.token_symbol
    const apyBps = pool?.apy_bps ?? 0
    if (decimals == null || !symbol || apyBps <= 0) continue
    const monthly = (BigInt(pos.underlying_amount) * BigInt(apyBps)) / BigInt(10000 * 12)
    if (monthly <= 0n) continue
    const existing = projectedBySymbol.get(symbol)
    if (!existing) {
      projectedBySymbol.set(symbol, { symbol, amount: monthly, decimals })
    } else if (existing.decimals === decimals) {
      existing.amount += monthly
    } else {
      // Same ticker, different token decimals: align both to the larger precision.
      const max = Math.max(existing.decimals, decimals)
      existing.amount =
        existing.amount * 10n ** BigInt(max - existing.decimals) + monthly * 10n ** BigInt(max - decimals)
      existing.decimals = max
    }
  }
  const projectedMonthly = [...projectedBySymbol.values()]

  return { strategies, projectedMonthly, isLoading }
}
