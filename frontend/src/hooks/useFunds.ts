import { useMemo } from 'react'
import {
  useBatchBalances,
  usePrivanaContext,
  useLockedFunds,
  usePendingWithdrawals,
} from '@oasisprotocol/privana-sdk'
import { formatUnits } from 'viem'
import { useEarnPools, useEarnBalance } from '@/api/earn'
import { useTokenPrices } from '@/api/coin-gecko'
import { computeEarnChange24h, type EarnChange24h } from '@/lib/earn'
import { mergeTokensBySymbol } from '@/lib/tokens'

export interface TokenBreakdown {
  symbol: string
  amount: bigint
  decimals: number
}

export interface Funds {
  /** True until every place funds can live has resolved. */
  isLoading: boolean
  /** Whether the user has funds in any bucket (available, locked, earn, pending withdrawal). */
  hasFunds: boolean
  /** Whether the user has idle (available, not-yet-invested) balance to put to work. */
  hasAvailableBalance: boolean
  /** Token ids with a positive available (idle) balance. Use for per-token gating. */
  availableTokenIds: Set<string>
  availableFiatValue: number | undefined
  /** Fiat value held in earn positions. */
  earningFiatValue: number | undefined
  /**
   * Yield-only 24h change across earn positions: fiat delta and percent
   * (0.8 means +0.8%). Null whenever any position's change is unknown —
   * hide the badge rather than show a partial or fabricated figure.
   */
  earnChange24h: EarnChange24h | null
  /** Fiat value held in active app locks ("in use" / not withdrawable). */
  lockedFiatValue: number | undefined
  totalFiatValue: number | undefined
  /** Per-token available (idle) balances, for token-denominated display. */
  availableTokens: TokenBreakdown[]
  /** Per-token earn-position balances, for token-denominated display. */
  earningTokens: TokenBreakdown[]
  /** Highest pool APY in basis points, or null when no pools. */
  bestApyBps: number | null
  pricesError: boolean
}

// Owns everything about "where the user's money is": fetching the buckets,
// the loading gate, the funded check, and the fiat totals. Shared by the
// dashboard and earn pages so the bucket logic lives in one place.
export function useFunds(): Funds {
  const { enabledTokens, tokensStatus, getTokenById } = usePrivanaContext()
  const tokenIds = useMemo(() => enabledTokens.map(t => t.id), [enabledTokens])
  const { balances, isLoading: balancesLoading } = useBatchBalances({ tokenIds })
  const { locks, totalLocked, isLoading: locksLoading } = useLockedFunds()
  const { data: earnBalance, isLoading: earnLoading } = useEarnBalance()
  const { hasPendingWithdrawals, isLoading: pendingWithdrawalsLoading } = usePendingWithdrawals()
  const { data: prices, isError: pricesError } = useTokenPrices(tokenIds)
  const { data: poolsData } = useEarnPools()

  // Hold the dashboard in its loading state until every place funds can live has
  // resolved, so we never flash the onboarding step at a user whose funds are
  // only in earn / locks / a pending withdrawal.
  const isLoading =
    tokensStatus !== 'ready' || balancesLoading || locksLoading || earnLoading || pendingWithdrawalsLoading

  const bestApyBps = useMemo(() => {
    const activePools = (poolsData?.pools ?? []).filter(p => p.status === 'active')
    return activePools.length ? Math.max(...activePools.map(p => p.apy_bps)) : null
  }, [poolsData])

  const { availableFiatValue, lockedFiatValue, earningFiatValue, totalFiatValue, earnChange24h } =
    useMemo(() => {
      if (!prices) {
        return {
          availableFiatValue: undefined,
          lockedFiatValue: undefined,
          earningFiatValue: undefined,
          totalFiatValue: undefined,
          earnChange24h: null,
        }
      }
      const fiatOf = (tokenId: string, amountWei: string): number => {
        const price = prices[tokenId]
        const decimals = getTokenById(tokenId)?.decimals
        if (price == null || decimals == null) return 0
        return Number(formatUnits(BigInt(amountWei || '0'), decimals)) * price
      }

      let available = 0
      let locked = 0
      for (const b of balances) {
        available += fiatOf(b.token_id, b.balance)
        locked += locks
          .filter(l => l.token_id === b.token_id)
          .reduce((sum, l) => sum + fiatOf(l.token_id, l.amount), 0)
      }
      // Earn positions are transferred into the pool (not held as a lock), so they
      // are a separate bucket from available/locked - no double counting. Their
      // underlying_amount already reflects accrued yield. (Pending in-flight
      // withdrawals are intentionally excluded; those funds are leaving.)
      let earning = 0
      for (const p of earnBalance?.positions ?? []) {
        earning += fiatOf(p.token_id, p.underlying_amount)
      }

      return {
        availableFiatValue: available,
        lockedFiatValue: locked,
        earningFiatValue: earning,
        totalFiatValue: available + locked + earning,
        earnChange24h: computeEarnChange24h(earnBalance?.positions ?? [], fiatOf),
      }
    }, [balances, locks, earnBalance, prices, getTokenById])

  // Per-token amounts for token-denominated display (Earning / Available rows).
  // Merged by symbol so token ids that share a ticker (e.g. several USDC ids)
  // collapse into one row. Independent of prices, so it survives a price error.
  const { availableTokens, earningTokens } = useMemo(
    () => ({
      availableTokens: mergeTokensBySymbol(
        balances.map(b => ({ tokenId: b.token_id, amount: b.balance, symbol: b.token_symbol })),
        getTokenById,
      ),
      earningTokens: mergeTokensBySymbol(
        (earnBalance?.positions ?? []).map(p => ({ tokenId: p.token_id, amount: p.underlying_amount })),
        getTokenById,
      ),
    }),
    [balances, earnBalance, getTokenById],
  )

  // Funds live in several places, not just the available wallet balance: locked
  // funds, active earn positions, and in-flight (pending) withdrawals all mean the
  // user is past onboarding. Treat the user as funded if any bucket is non-zero.
  const availableTokenIds = useMemo(
    () => new Set(balances.filter(b => BigInt(b.balance || '0') > 0n).map(b => b.token_id)),
    [balances],
  )
  const hasAvailableBalance = availableTokenIds.size > 0
  const hasFunds =
    hasAvailableBalance ||
    BigInt(totalLocked || '0') > 0n ||
    (earnBalance?.positions ?? []).some(p => BigInt(p.underlying_amount || '0') > 0n) ||
    hasPendingWithdrawals

  return {
    isLoading,
    hasFunds,
    hasAvailableBalance,
    availableTokenIds,
    availableFiatValue,
    earningFiatValue,
    earnChange24h,
    lockedFiatValue,
    totalFiatValue,
    availableTokens,
    earningTokens,
    bestApyBps,
    pricesError,
  }
}
