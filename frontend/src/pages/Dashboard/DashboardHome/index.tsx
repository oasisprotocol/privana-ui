import { Button } from '@/components/ui/button'
import {
  GitCompare,
  ArrowDownToLine,
  ArrowUpToLine,
  History,
  Percent,
  Zap,
  ArrowLeftRight,
  TrendingUp,
} from 'lucide-react'
import { PortfolioCard } from './PortfolioCard'
import { ComponentProps, useMemo, useState, type ReactNode } from 'react'
import {
  PrivanaModal,
  useBatchBalances,
  usePrivanaContext,
  useLockedFunds,
  usePendingWithdrawals,
} from '@oasisprotocol/privana-sdk'
import { formatUnits } from 'viem'
import { Skeleton } from '@/components/ui/skeleton'
import { PortfolioSummary } from './PortfolioSummary'
import { useEarnPools, useEarnBalance } from '@/api/earn'
import { formatApyBps } from '@/pages/Earn/labels'
import { useTokenPrices } from '@/api/coin-gecko'
import { formatFiat } from '@/lib/tokens'
import { activityPath, earnPath, tradePath } from '@/paths'
import { Link } from 'react-router'

const FeatureRow = ({
  icon,
  title,
  pill,
  description,
}: {
  icon: ReactNode
  title: string
  pill?: ReactNode
  description: string
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
      {icon}
    </div>
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {pill}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
)

export const DashboardHome = () => {
  const [modalOpen, setModalOpen] = useState<ComponentProps<typeof PrivanaModal>['defaultTab']>(undefined)
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
  const pending =
    tokensStatus !== 'ready' || balancesLoading || locksLoading || earnLoading || pendingWithdrawalsLoading

  const bestApyBps = useMemo(() => {
    const pools = poolsData?.pools ?? []
    return pools.length ? Math.max(...pools.map(p => p.apy_bps)) : null
  }, [poolsData])

  const { availableFiatValue, totalFiatValue } = useMemo(() => {
    // TODO: take into account yield, pending etc when API is ready
    if (!prices) return { availableFiatValue: undefined, totalFiatValue: undefined }
    let available = 0
    let total = 0
    for (const b of balances) {
      const price = prices[b.token_id]
      if (price == null) continue
      const decimals = getTokenById(b.token_id)?.decimals
      if (decimals == null) continue
      const availableAmount = Number(formatUnits(BigInt(b.balance || '0'), decimals))
      const lockedAmount = locks
        .filter(l => l.token_id === b.token_id)
        .reduce((sum, l) => sum + Number(formatUnits(BigInt(l.amount), decimals)), 0)
      available += availableAmount * price
      total += (availableAmount + lockedAmount) * price
    }
    return { availableFiatValue: available, totalFiatValue: total }
  }, [balances, locks, prices, getTokenById])

  const hasFunds =
    balances.some(b => BigInt(b.balance || '0') > 0n) ||
    BigInt(totalLocked || '0') > 0n ||
    (earnBalance?.positions ?? []).some(p => BigInt(p.underlying_amount || '0') > 0n) ||
    hasPendingWithdrawals

  return (
    <>
      <div className="flex flex-col gap-6 mb-8 md:mb-12">
        {pending && <Skeleton className="h-100 w-full" />}
        {!pending && !hasFunds && (
          <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground leading-5">Total balance</span>
              <span className="mt-3 inline-flex items-baseline tabular-nums text-5xl font-semibold tracking-tight text-foreground">
                <span className="text-[0.75em] text-muted-foreground">$</span>
                <span>0</span>
                <span className="text-muted-foreground">.00</span>
              </span>
            </div>

            <div className="rounded-2xl bg-white dark:bg-card p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_2px_0_rgba(87,97,117,0.05),0_4px_10px_0_rgba(87,97,117,0.08)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_1px_2px_0_rgba(0,0,0,0.4),0_4px_12px_0_rgba(0,0,0,0.5)]">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Add funds to get started
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Deposit ETH, HYPE or USDC to start using Privana.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <FeatureRow
                  icon={<Zap className="h-4 w-4" />}
                  title="Earn Daily"
                  pill={
                    bestApyBps != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-chart-positive px-2 py-0.5 text-xs font-semibold text-white">
                        <TrendingUp className="h-3 w-3" />
                        {formatApyBps(bestApyBps)} APY
                      </span>
                    ) : undefined
                  }
                  description="Interest accrues every day and compounds automatically."
                />
                <FeatureRow
                  icon={<ArrowLeftRight className="h-4 w-4" />}
                  title="Swap privately"
                  description="Private non-custodial swaps over established DeFi protocols."
                />
              </div>
              <div className="mt-6 flex justify-center">
                <Button size="lg" onClick={() => setModalOpen('deposit')}>
                  Deposit crypto
                </Button>
              </div>
            </div>
          </div>
        )}
        {!pending && hasFunds && (
          <div className="flex flex-col gap-6">
            <div className="flex md:justify-end">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 rounded-lg border bg-card p-3 w-full md:w-auto">
                <div className="flex md:items-center gap-3 text-base font-medium">
                  <span className="text-secondary-foreground">Available funds</span>
                  {pricesError ? (
                    <span className="text-foreground" title="Token prices are temporarily unavailable.">
                      -
                    </span>
                  ) : pricesPending || availableFiatValue === undefined ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <span className="text-foreground">{formatFiat(availableFiatValue)}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="xs" onClick={() => setModalOpen('deposit')}>
                    <ArrowDownToLine />
                    Deposit
                  </Button>
                  <Button variant="secondary" size="xs" onClick={() => setModalOpen('withdraw')}>
                    <ArrowUpToLine />
                    Withdraw
                  </Button>
                  <Button variant="secondary" size="xs" asChild>
                    <Link to={activityPath()} viewTransition>
                      <History />
                      See activity
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row justify-between lg:items-center">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <h3 className="text-xl font-semibold text-tertiary-foreground">Total balance</h3>
                  <h2
                    className="text-3xl font-medium text-card-foreground"
                    title={pricesError ? 'Token prices are temporarily unavailable.' : undefined}
                  >
                    {pricesError ? '-' : formatFiat(totalFiatValue ?? 0)}
                  </h2>
                  <span className="text-lg font-semibold text-chart-positive">+$0.00 (+0%)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasFunds && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-24 w-full">
            <PortfolioCard
              icon={<GitCompare />}
              title="Swap"
              buttonLabel="Make your private swap"
              to={tradePath()}
            />
            <PortfolioCard
              icon={<Percent />}
              title="Earn"
              buttonLabel="Check out earning strategies"
              to={earnPath()}
            />
          </div>

          <PortfolioSummary />
        </>
      )}

      <PrivanaModal
        open={!!modalOpen}
        onClose={() => setModalOpen(undefined)}
        showLockedFunds={false}
        defaultTab={modalOpen}
      />
    </>
  )
}
