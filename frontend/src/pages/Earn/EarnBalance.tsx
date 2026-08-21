import { useMemo, useState } from 'react'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { CHART_RANGE_DAYS, useEarnHistory, type ChartRange } from '@/api/portfolio'
import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/SurfaceCard'
import { BalanceAmount } from '@/components/BalanceAmount'
import { PortfolioChartPlaceholder, PortfolioChartSection } from '@/components/PortfolioChart'
import { formatFiat, formatAmount } from '@/lib/tokens'
import { formatApyBps } from '@/lib/apy'
import { cn } from '@/lib/utils'
import type { TokenAmount } from './useActiveStrategies'

// Mock until the API exposes accrued yield since deposit + a real period delta.
// TODO: replace with real accrued-yield / change figures.
const TOTAL_EARNED_MOCK = 7.5
const MOCK_CHANGE_PCT = 0.8

// Earned is still a *fiat (USD) mock* — the backend doesn't report accrued-yield-
// since-deposit yet, so there's no per-token figure to break it down by. A USD mock
// only makes sense against a $1 stablecoin, so it's labelled USDC. Projected below is
// real and per-token; make Earned per-token too once the accrued-yield endpoint lands.
const EARN_DISPLAY_SYMBOL = 'USDC'

const formatToken = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TokenValue = ({ symbol, amount, positive }: { symbol: string; amount: string; positive?: boolean }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 font-medium tabular-nums',
      positive ? 'text-chart-positive' : 'text-foreground',
    )}
  >
    {positive ? '+' : ''}
    {amount}
    <span className="inline-flex size-4 shrink-0 overflow-hidden rounded-full">
      {getTokenIcon(symbol, 16)}
    </span>
    {symbol}
  </span>
)

type EarnBalanceProps = {
  earningFiatValue: number | undefined
  bestApyBps: number | null
  pricesError: boolean
  projected: TokenAmount[]
  loading: boolean
}

export const EarnBalance = ({
  earningFiatValue,
  bestApyBps,
  pricesError,
  projected,
  loading,
}: EarnBalanceProps) => {
  const isEarning = (earningFiatValue ?? 0) > 0
  const [chartRange, setChartRange] = useState<ChartRange>('all')
  const { data: earnHistory, isLoading: chartLoading } = useEarnHistory(CHART_RANGE_DAYS[chartRange])
  const chartData = useMemo(
    () => (earnHistory?.points ?? []).map(p => ({ date: String(p.timestamp), value: Number(p.value_usd) })),
    [earnHistory],
  )
  const earned = isEarning ? TOTAL_EARNED_MOCK : 0
  const changeUsd = (earningFiatValue ?? 0) * (MOCK_CHANGE_PCT / 100)

  return (
    <SurfaceCard className="grid gap-6 rounded-3xl p-6 md:gap-8 md:p-8 lg:grid-cols-2">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium leading-5 text-muted-foreground">Earn balance</span>
          {!loading && isEarning && bestApyBps != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-chart-positive px-2.5 py-1 text-xs font-semibold text-white">
              {formatApyBps(bestApyBps)} APY
            </span>
          )}
        </div>

        {loading ? (
          <Skeleton className="mt-3 h-14 w-48 rounded-md" />
        ) : pricesError ? (
          <span className="mt-3 text-6xl font-semibold tracking-tight text-foreground">-</span>
        ) : earningFiatValue === undefined ? (
          <Skeleton className="mt-3 h-14 w-48 rounded-md" />
        ) : (
          <BalanceAmount value={earningFiatValue} className="mt-3 text-6xl animate-fade-in" />
        )}

        {!loading && isEarning && (
          <span className="mt-2 text-sm font-medium text-chart-positive">
            +{formatFiat(changeUsd)} (+{MOCK_CHANGE_PCT.toFixed(2)}%)
          </span>
        )}

        {loading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-6 w-52 rounded-md" />
          </div>
        ) : (
          <div className="mt-6 space-y-2.5 text-lg">
            <div className="flex items-center gap-3">
              <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-chart-positive" />
              <span className="font-medium">Earned</span>
              <TokenValue symbol={EARN_DISPLAY_SYMBOL} amount={formatToken(earned)} positive />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-primary" />
                <span className="font-medium">Projected</span>
                {projected.length > 0 ? (
                  projected.map(t => (
                    <TokenValue
                      key={t.symbol}
                      symbol={t.symbol}
                      amount={formatAmount(t.amount, t.decimals)}
                      positive
                    />
                  ))
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <p className="mt-0.5 pl-[1.375rem] text-xs text-muted-foreground">
                Estimated monthly rewards at current APY
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center">
        {loading || (isEarning && chartLoading) ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : isEarning ? (
          <PortfolioChartSection
            data={chartData}
            range={chartRange}
            onRangeChange={setChartRange}
            emptyLabel="Your performance chart appears once you start earning."
          />
        ) : (
          <PortfolioChartPlaceholder label="Your performance chart appears once you start earning." />
        )}
      </div>
    </SurfaceCard>
  )
}
