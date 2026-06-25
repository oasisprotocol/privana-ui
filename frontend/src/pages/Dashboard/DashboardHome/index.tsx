import { Button } from '@/components/ui/button'
import { Zap, ArrowLeftRight, TrendingUp } from 'lucide-react'
import { ComponentProps, useState, type ReactNode } from 'react'
import { PrivanaModal } from '@oasisprotocol/privana-sdk'
import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/SurfaceCard'
import { formatApyBps } from '@/lib/apy'
import { formatFiat } from '@/lib/tokens'
import { earnPath, tradePath } from '@/paths'
import { Link } from 'react-router'
import { useDashboardFunds } from './useDashboardFunds'
import { BalanceAmount } from './BalanceAmount'
import { PortfolioChart } from './PortfolioChart'
import { LatestActivity } from './LatestActivity'

// Shared sizing for the dashboard's primary call-to-action buttons.
const CTA_BUTTON = 'h-14 px-8 text-base w-full sm:w-auto sm:min-w-[200px]'

const BreakdownRow = ({
  dotClass,
  label,
  value,
  error,
}: {
  dotClass: string
  label: string
  value: number | undefined
  error: boolean
}) => (
  <div className="flex items-center gap-2">
    <span className={`size-2 rounded-full ${dotClass}`} />
    <span className="font-semibold text-foreground">{label}</span>
    {error ? (
      <span className="text-muted-foreground">-</span>
    ) : value === undefined ? (
      <Skeleton className="h-4 w-16" />
    ) : (
      <span className="text-muted-foreground">{formatFiat(value)}</span>
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
  const [modalOpen, setModalOpen] = useState<ComponentProps<typeof PrivanaModal>['defaultTab']>(undefined)
  const {
    isLoading,
    hasFunds,
    hasAvailableBalance,
    availableFiatValue,
    earningFiatValue,
    totalFiatValue,
    bestApyBps,
    pricesError,
  } = useDashboardFunds()

  // Rough "earn about $X / month" estimate: available × APY ÷ 12.
  const monthlyEarnEstimate = ((availableFiatValue ?? 0) * (bestApyBps ?? 0)) / 10000 / 12

  return (
    <>
      <div className="flex flex-col gap-6 mb-8 md:mb-12 w-full max-w-200 mx-auto">
        {isLoading && <Skeleton className="h-100 w-full" />}
        {!isLoading && !hasFunds && (
          <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground leading-5">Total balance</span>
              <BalanceAmount value={totalFiatValue ?? 0} className="mt-3" />
            </div>

            <SurfaceCard className="p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Add funds to get started
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Deposit ETH, HYPE or USDC to start using Privana.
              </p>
              <DepositFeatures bestApyBps={bestApyBps} />
              <div className="mt-6 flex justify-center">
                <Button size="lg" className={CTA_BUTTON} onClick={() => setModalOpen('deposit')}>
                  Deposit crypto
                </Button>
              </div>
            </SurfaceCard>
          </div>
        )}
        {!isLoading && hasFunds && (
          <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground leading-5">Total balance</span>
                {pricesError ? (
                  <span className="mt-3 text-5xl font-semibold tracking-tight text-foreground">-</span>
                ) : totalFiatValue === undefined ? (
                  <Skeleton className="mt-3 h-12 w-44 rounded-md" />
                ) : (
                  <BalanceAmount value={totalFiatValue} className="mt-3" />
                )}
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <BreakdownRow
                  dotClass="bg-chart-positive"
                  label="Earning"
                  value={earningFiatValue}
                  error={pricesError}
                />
                <BreakdownRow
                  dotClass="bg-primary"
                  label="Available"
                  value={availableFiatValue}
                  error={pricesError}
                />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <PortfolioChart />
              <div className="flex justify-center">
                <Button size="lg" className={CTA_BUTTON} onClick={() => setModalOpen('deposit')}>
                  Deposit
                </Button>
              </div>
            </div>

            {hasAvailableBalance && (
              <SurfaceCard className="p-6">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Put your deposit to work
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your{' '}
                  <span className="font-medium text-foreground">{formatFiat(availableFiatValue ?? 0)}</span>{' '}
                  is ready. Earn about{' '}
                  <span className="font-medium text-foreground">{formatFiat(monthlyEarnEstimate)}</span> /
                  month, or swap it privately.
                </p>
                <DepositFeatures bestApyBps={bestApyBps} />
                <div className="mt-6 flex flex-col items-center gap-3">
                  <Button asChild size="lg" className={CTA_BUTTON}>
                    <Link to={earnPath()} viewTransition>
                      Earn daily
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className={CTA_BUTTON}>
                    <Link to={tradePath()} viewTransition>
                      Swap privately
                    </Link>
                  </Button>
                </div>
              </SurfaceCard>
            )}

            <LatestActivity />
          </div>
        )}
      </div>

      <PrivanaModal
        open={!!modalOpen}
        onClose={() => setModalOpen(undefined)}
        showLockedFunds={false}
        defaultTab={modalOpen}
      />
    </>
  )
}
