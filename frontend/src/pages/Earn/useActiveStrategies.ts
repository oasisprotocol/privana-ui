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
  /**
   * Per-token yield accrued on the shares still held, or null when the backend
   * cannot stand behind a figure for every active position (the UI shows a
   * dash rather than an understated sum).
   */
  earned: TokenAmount[] | null
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

  // Aggregate by symbol so multiple pools of the same token collapse into one
  // figure. Same ticker with different token decimals aligns to the larger
  // precision.
  const addBySymbol = (map: Map<string, TokenAmount>, symbol: string, amount: bigint, decimals: number) => {
    const existing = map.get(symbol)
    if (!existing) {
      map.set(symbol, { symbol, amount, decimals })
    } else if (existing.decimals === decimals) {
      existing.amount += amount
    } else {
      const max = Math.max(existing.decimals, decimals)
      existing.amount =
        existing.amount * 10n ** BigInt(max - existing.decimals) + amount * 10n ** BigInt(max - decimals)
      existing.decimals = max
    }
  }

  // Per-token projected monthly rewards on the active positions:
  // underlying × apy_bps / (10000 × 12).
  const projectedBySymbol = new Map<string, TokenAmount>()
  for (const pos of activePositions) {
    const pool = poolsById.get(pos.pool_id)
    const token = pool ? tokensById.get(pool.token_id) : tokensById.get(pos.token_id)
    const apyBps = pool?.apy_bps ?? 0
    if (token?.token_decimals == null || !token.token_symbol || apyBps <= 0) continue
    const monthly = (BigInt(pos.underlying_amount) * BigInt(apyBps)) / BigInt(10000 * 12)
    if (monthly <= 0n) continue
    addBySymbol(projectedBySymbol, token.token_symbol, monthly, token.token_decimals)
  }
  const projectedMonthly = [...projectedBySymbol.values()]

  // Per-token earned on the active positions. The backend sets earned_active
  // only when it can stand behind the figure (earned_active_status "ok"); any
  // active position without one makes the total unknown, so report null rather
  // than an understated sum.
  const earnedBySymbol = new Map<string, TokenAmount>()
  let earnedKnown = true
  for (const pos of activePositions) {
    const pool = poolsById.get(pos.pool_id)
    const token = pool ? tokensById.get(pool.token_id) : tokensById.get(pos.token_id)
    if (pos.earned_active == null || token?.token_decimals == null || !token.token_symbol) {
      earnedKnown = false
      break
    }
    addBySymbol(earnedBySymbol, token.token_symbol, BigInt(pos.earned_active), token.token_decimals)
  }
  const earned = earnedKnown ? [...earnedBySymbol.values()] : null

  return { strategies, projectedMonthly, earned, isLoading }
}
