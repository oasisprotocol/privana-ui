import type { EarnBalance } from '@/api/earn'

export interface EarnChange24h {
  /** Fiat delta over the last ~24h. */
  usd: number
  /** Percent of the window-start value: 0.8 means +0.8%. */
  pct: number
}

type ChangePosition = Pick<EarnBalance, 'token_id' | 'shares' | 'underlying_amount' | 'change_24h'>

/**
 * Yield-only 24h change across earn positions. change_24h is null whenever the
 * backend cannot compute it honestly, and a partial sum would understate the
 * move, so this returns null — hide the badge — unless every live position
 * reports one. The percent is recomputed over the aggregate:
 * Σ change / Σ window-start value, where window-start value is
 * underlying − change (the backend guarantees no cashflow touched the window).
 */
export const computeEarnChange24h = (
  positions: ChangePosition[],
  fiatOf: (tokenId: string, amount: string) => number,
): EarnChange24h | null => {
  const live = positions.filter(p => BigInt(p.shares || '0') > 0n)
  if (live.length === 0 || live.some(p => p.change_24h == null)) return null
  const usd = live.reduce((sum, p) => sum + fiatOf(p.token_id, p.change_24h!), 0)
  const baseUsd = live.reduce(
    (sum, p) => sum + fiatOf(p.token_id, (BigInt(p.underlying_amount) - BigInt(p.change_24h!)).toString()),
    0,
  )
  if (baseUsd <= 0) return null
  return { usd, pct: (usd / baseUsd) * 100 }
}
