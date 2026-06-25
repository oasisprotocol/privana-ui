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

export interface DashboardFunds {
  /** True until every place funds can live has resolved. */
  isLoading: boolean
  /** Whether the user has funds in any bucket (available, locked, earn, pending withdrawal). */
  hasFunds: boolean
  availableFiatValue: number | undefined
  /** Fiat value held in earn positions. */
  earningFiatValue: number | undefined
  totalFiatValue: number | undefined
  /** Highest pool APY in basis points, or null when no pools. */
  bestApyBps: number | null
  pricesError: boolean
  pricesPending: boolean
}

// Owns everything about "where the user's money is": fetching the buckets,
// the loading gate, the funded check, and the fiat totals. Keeping it here
// leaves DashboardHome as mostly markup and makes this logic testable.
export function useDashboardFunds(): DashboardFunds {
  const { enabledTokens, tokensStatus, getTokenById } = usePrivanaContext()
  const tokenIds = useMemo(() => enabledTokens.map(t => t.id), [enabledTokens])
  const { balances, isLoading: balancesLoading } = useBatchBalances({ tokenIds })
  const { locks, totalLocked, isLoading: locksLoading } = useLockedFunds()
  const { data: earnBalance, isLoading: earnLoading } = useEarnBalance()
  const { hasPendingWithdrawals, isLoading: pendingWithdrawalsLoading } = usePendingWithdrawals()
  const { data: prices, isPending: pricesPending, isError: pricesError } = useTokenPrices(tokenIds)
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

  const { availableFiatValue, earningFiatValue, totalFiatValue } = useMemo(() => {
    if (!prices) {
      return { availableFiatValue: undefined, earningFiatValue: undefined, totalFiatValue: undefined }
    }
    const fiatOf = (tokenId: string, amountWei: string): number => {
      const price = prices[tokenId]
      const decimals = getTokenById(tokenId)?.decimals
      if (price == null || decimals == null) return 0
      return Number(formatUnits(BigInt(amountWei || '0'), decimals)) * price
    }

    let available = 0
    let total = 0
    for (const b of balances) {
      const availableValue = fiatOf(b.token_id, b.balance)
      const lockedValue = locks
        .filter(l => l.token_id === b.token_id)
        .reduce((sum, l) => sum + fiatOf(l.token_id, l.amount), 0)
      available += availableValue
      total += availableValue + lockedValue
    }
    // Earn positions are transferred into the pool (not held as a lock), so they
    // are a separate bucket from available/locked - no double counting. Their
    // underlying_amount already reflects accrued yield. (Pending in-flight
    // withdrawals are intentionally excluded; those funds are leaving.)
    let earning = 0
    for (const p of earnBalance?.positions ?? []) {
      earning += fiatOf(p.token_id, p.underlying_amount)
    }
    total += earning
    return { availableFiatValue: available, earningFiatValue: earning, totalFiatValue: total }
  }, [balances, locks, earnBalance, prices, getTokenById])

  // Funds live in several places, not just the available wallet balance: locked
  // funds, active earn positions, and in-flight (pending) withdrawals all mean the
  // user is past onboarding. Treat the user as funded if any bucket is non-zero.
  const hasFunds =
    balances.some(b => BigInt(b.balance || '0') > 0n) ||
    BigInt(totalLocked || '0') > 0n ||
    (earnBalance?.positions ?? []).some(p => BigInt(p.underlying_amount || '0') > 0n) ||
    hasPendingWithdrawals

  return {
    isLoading,
    hasFunds,
    availableFiatValue,
    earningFiatValue,
    totalFiatValue,
    bestApyBps,
    pricesError,
    pricesPending,
  }
}
