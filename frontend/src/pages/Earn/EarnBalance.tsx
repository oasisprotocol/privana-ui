import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/SurfaceCard'
import { BalanceAmount } from '@/components/BalanceAmount'
import { PortfolioChart } from '@/components/PortfolioChart'
import { formatFiat } from '@/lib/tokens'
import { formatApyBps, apyBpsToFraction } from '@/lib/apy'

// Mock until the API exposes accrued yield since deposit.
// TODO: replace with the real accrued-yield figure.
const TOTAL_EARNED_MOCK = 7.5

type EarnBalanceProps = {
  earningFiatValue: number | undefined
  bestApyBps: number | null
  pricesError: boolean
}

export const EarnBalance = ({ earningFiatValue, bestApyBps, pricesError }: EarnBalanceProps) => {
  const isEarning = (earningFiatValue ?? 0) > 0
  // Rough "earn about $X / month": balance × annual APY ÷ 12 months.
  const projectedMonthly = ((earningFiatValue ?? 0) * apyBpsToFraction(bestApyBps ?? 0)) / 12

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground leading-5">Earn balance</span>
          {isEarning && bestApyBps != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-chart-positive px-2.5 py-1 text-xs font-semibold text-white">
              {formatApyBps(bestApyBps)} APY
            </span>
          )}
        </div>
        {pricesError ? (
          <span className="text-5xl font-semibold tracking-tight text-foreground">-</span>
        ) : earningFiatValue === undefined ? (
          <Skeleton className="h-12 w-44 rounded-md" />
        ) : (
          <BalanceAmount value={earningFiatValue} />
        )}
      </div>

      {isEarning && <PortfolioChart />}

      <SurfaceCard className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total earned</span>
          <span className="font-medium tabular-nums text-chart-positive">
            +{formatFiat(isEarning ? TOTAL_EARNED_MOCK : 0)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Projected / month</span>
          <span className="font-medium tabular-nums text-foreground">{formatFiat(projectedMonthly)}</span>
        </div>
      </SurfaceCard>
    </div>
  )
}
