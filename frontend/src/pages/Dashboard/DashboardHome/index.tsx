import { Button } from '@/components/ui/button'
import { Zap, ArrowLeftRight, TrendingUp } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAccount } from 'wagmi'
import { DepositModal, getTokenIcon, useSiweAuth } from '@oasisprotocol/privana-sdk'
import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/SurfaceCard'
import { formatApyBps, apyBpsToFraction } from '@/lib/apy'
import { formatFiat, formatAmount } from '@/lib/tokens'
import { earnPath, tradePath } from '@/paths'
import { Link } from 'react-router'
import { useFunds, type TokenBreakdown } from '@/hooks/useFunds'
import { useMergedActivity } from '@/hooks/use-merged-activity'
import { cn } from '@/lib/utils'
import { BalanceAmount } from '@/components/BalanceAmount'
import { PortfolioChart } from '@/components/PortfolioChart'
import { LatestActivity } from './LatestActivity'
import { HISTORY_FETCH_LIMIT } from './latestActivity.constants'
import { DashboardBootState } from './DashboardBootState'
import { useBootPhase } from './useBootPhase'

// Shared sizing for the dashboard's primary call-to-action buttons.
const CTA_BUTTON = 'h-14 px-8 text-base w-full sm:w-auto sm:min-w-[200px]'

const BreakdownRow = ({
  dotClass,
  label,
  tokens,
  fiatFallback,
  error,
}: {
  dotClass: string
  label: string
  tokens: TokenBreakdown[]
  fiatFallback: number | undefined
  error: boolean
}) => (
  <div className="flex items-center gap-2">
    <span className={`size-2 shrink-0 rounded-full ${dotClass}`} />
    <span className="font-semibold text-foreground">{label}</span>
    {tokens.length > 0 ? (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        {tokens.map(token => (
          <TokenAmountInline key={token.symbol} token={token} />
        ))}
      </span>
    ) : error ? (
      <span className="text-muted-foreground">-</span>
    ) : fiatFallback === undefined ? (
      <Skeleton className="h-4 w-16" />
    ) : (
      <span className="text-muted-foreground">{formatFiat(fiatFallback)}</span>
    )}
  </div>
)

const TokenAmountInline = ({ token, size = 'sm' }: { token: TokenBreakdown; size?: 'sm' | 'lg' }) => {
  const lg = size === 'lg'
  return (
    <span className={cn('inline-flex items-center gap-1.5 tabular-nums', lg ? 'text-lg' : 'text-sm')}>
      <span className={cn('text-foreground', lg ? 'font-semibold' : 'font-medium')}>
        {formatAmount(token.amount, token.decimals)}
      </span>
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <span className={cn('self-center overflow-hidden rounded-full', lg ? 'size-4' : 'size-3')}>
          {getTokenIcon(token.symbol, lg ? 16 : 12)}
        </span>
        {token.symbol}
      </span>
    </span>
  )
}

const DesktopBreakdownRow = ({
  dotClass,
  label,
  tokens,
  fiatFallback,
  error,
}: {
  dotClass: string
  label: string
  tokens: TokenBreakdown[]
  fiatFallback: number | undefined
  error: boolean
}) => (
  <div className="flex items-start gap-3 text-lg">
    <span className="inline-flex items-center gap-2.5 font-medium text-foreground">
      <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${dotClass}`} />
      {label}
    </span>
    {tokens.length > 0 ? (
      <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
        {tokens.map(token => (
          <TokenAmountInline key={token.symbol} token={token} size="lg" />
        ))}
      </span>
    ) : error ? (
      <span className="text-muted-foreground">-</span>
    ) : fiatFallback === undefined ? (
      <Skeleton className="h-5 w-20" />
    ) : (
      <span className="text-muted-foreground">{formatFiat(fiatFallback)}</span>
    )}
  </div>
)

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

const DepositFeatures = ({ bestApyBps }: { bestApyBps: number | null }) => (
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
)

export const DashboardHome = () => {
  const [depositTab, setDepositTab] = useState<'crypto' | 'credit-card' | null>(null)
  const {
    isLoading,
    hasFunds,
    hasAvailableBalance,
    availableFiatValue,
    earningFiatValue,
    totalFiatValue,
    availableTokens,
    earningTokens,
    bestApyBps,
    pricesError,
  } = useFunds()

  // Hoisted out of LatestActivity so the history/unsettled fetch starts on mount in parallel with very slow balance reads.
  const { rows: activityRows, isLoading: activityLoading } = useMergedActivity(HISTORY_FETCH_LIMIT)

  // Balance reads are slow today; play a short branded boot sequence in place of a bare skeleton.
  // Keyed on account + auth so switching accounts or re-authenticating replays it.
  const { address } = useAccount()
  const { isAuthenticated } = useSiweAuth()
  const bootPhase = useBootPhase(isLoading, `${address?.toLowerCase() ?? ''}:${isAuthenticated}`)

  // Rough "earn about $X / month" estimate: available × annual APY ÷ 12 months.
  const monthlyEarnEstimate = ((availableFiatValue ?? 0) * apyBpsToFraction(bestApyBps ?? 0)) / 12

  return (
    <>
      <div className="flex flex-col gap-6 mb-8 md:mb-12 w-full max-w-200 md:max-w-none mx-auto">
        {bootPhase !== 'done' && <DashboardBootState phase={bootPhase} />}
        {bootPhase === 'done' && !hasFunds && (
          <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col md:hidden">
              <span className="text-sm font-medium text-muted-foreground leading-5">Total balance</span>
              <BalanceAmount value={totalFiatValue ?? 0} className="mt-3 animate-fade-in" />
            </div>

            <SurfaceCard className="p-6 w-full md:mx-auto md:max-w-xl md:rounded-3xl md:p-8">
              <div className="mb-6 hidden md:block">
                <div className="text-sm font-medium text-muted-foreground">Total balance</div>
                <BalanceAmount value={totalFiatValue ?? 0} className="mt-1 text-4xl animate-fade-in" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Add funds to get started
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Deposit ETH, HYPE or USDC to start using Privana.
              </p>
              {bestApyBps != null && (
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-chart-positive/10 px-4 py-3">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-chart-positive" />
                  <p className="text-sm text-foreground">
                    At <span className="font-semibold">{formatApyBps(bestApyBps)} APY</span>, every $1,000
                    earns about{' '}
                    <span className="font-semibold text-chart-positive">
                      {formatFiat(1000 * apyBpsToFraction(bestApyBps))}
                    </span>{' '}
                    a year.
                  </p>
                </div>
              )}
              <DepositFeatures bestApyBps={bestApyBps} />
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  size="lg"
                  className="h-14 px-8 text-base w-full"
                  onClick={() => setDepositTab('crypto')}
                >
                  Deposit crypto
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base w-full"
                  onClick={() => setDepositTab('credit-card')}
                >
                  Buy with card
                </Button>
              </div>
            </SurfaceCard>
          </div>
        )}
        {bootPhase === 'done' && hasFunds && (
          <div className="flex flex-col gap-8 w-full">
            {/* Desktop: two-column balance card (balance + breakdown + CTA | chart) */}
            <SurfaceCard className="hidden md:grid md:grid-cols-2 md:gap-8 rounded-3xl p-8">
              <div className="flex flex-col lg:pr-12">
                <span className="text-sm font-medium text-muted-foreground">Total balance</span>
                {pricesError ? (
                  <span className="mt-3 text-6xl font-semibold tracking-tight text-foreground">-</span>
                ) : totalFiatValue === undefined ? (
                  <Skeleton className="mt-3 h-14 w-56 rounded-md" />
                ) : (
                  <BalanceAmount value={totalFiatValue} className="mt-3 text-6xl animate-fade-in" />
                )}
                <div className="mt-6 space-y-2.5">
                  <DesktopBreakdownRow
                    dotClass="bg-chart-positive"
                    label="Earning"
                    tokens={earningTokens}
                    fiatFallback={earningFiatValue}
                    error={pricesError}
                  />
                  <DesktopBreakdownRow
                    dotClass="bg-primary"
                    label="Available"
                    tokens={availableTokens}
                    fiatFallback={availableFiatValue}
                    error={pricesError}
                  />
                </div>
                <Button
                  size="lg"
                  className="mt-8 h-14 text-base w-full sm:w-80 sm:self-start"
                  onClick={() => setDepositTab('crypto')}
                >
                  Deposit
                </Button>
              </div>
              <div className="flex flex-col justify-center">
                <PortfolioChart />
              </div>
            </SurfaceCard>

            <div className="flex flex-col gap-8 md:hidden">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-muted-foreground leading-5">Total balance</span>
                  {pricesError ? (
                    <span className="mt-3 text-5xl font-semibold tracking-tight text-foreground">-</span>
                  ) : totalFiatValue === undefined ? (
                    <Skeleton className="mt-3 h-12 w-44 rounded-md" />
                  ) : (
                    <BalanceAmount value={totalFiatValue} className="mt-3 animate-fade-in" />
                  )}
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <BreakdownRow
                    dotClass="bg-chart-positive"
                    label="Earning"
                    tokens={earningTokens}
                    fiatFallback={earningFiatValue}
                    error={pricesError}
                  />
                  <BreakdownRow
                    dotClass="bg-primary"
                    label="Available"
                    tokens={availableTokens}
                    fiatFallback={availableFiatValue}
                    error={pricesError}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <PortfolioChart />
                <div className="flex justify-center">
                  <Button size="lg" className={CTA_BUTTON} onClick={() => setDepositTab('crypto')}>
                    Deposit
                  </Button>
                </div>
              </div>
            </div>

            {hasAvailableBalance && (
              <SurfaceCard className="w-full p-6 md:rounded-3xl md:p-8">
                {/* Desktop (lg+) splits into two columns; below lg it collapses to the
                    single-column mobile flow (title + features, then buttons). */}
                <div className="grid items-center gap-x-10 gap-y-6 lg:grid-cols-[1fr_20rem]">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      Put your deposit to work
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your{' '}
                      <span className="font-medium text-foreground">
                        {formatFiat(availableFiatValue ?? 0)}
                      </span>{' '}
                      is ready. Earn about{' '}
                      <span className="font-medium text-foreground">{formatFiat(monthlyEarnEstimate)}</span> /
                      month, or swap it privately.
                    </p>
                    <DepositFeatures bestApyBps={bestApyBps} />
                  </div>
                  <div className="space-y-3">
                    <Button asChild size="lg" className="h-14 px-8 text-base w-full">
                      <Link to={earnPath()} viewTransition>
                        Earn daily
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base w-full">
                      <Link to={tradePath()} viewTransition>
                        Swap privately
                      </Link>
                    </Button>
                  </div>
                </div>
              </SurfaceCard>
            )}

            <LatestActivity rows={activityRows} isLoading={activityLoading} />
          </div>
        )}
      </div>

      <DepositModal
        open={depositTab !== null}
        onClose={() => setDepositTab(null)}
        defaultTab={depositTab ?? 'crypto'}
      />
    </>
  )
}
