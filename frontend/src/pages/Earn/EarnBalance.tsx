import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/SurfaceCard'
import { BalanceAmount } from '@/components/BalanceAmount'
import { PortfolioChart, type PortfolioPoint } from '@/components/PortfolioChart'
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

// Empty-state placeholder curve — matches the design's dimmed "trend" chart: a
// smoothstep S-curve from startValueUsd → endValueUsd over `days` points.
const trendCurve = (start: number, end: number, days: number): PortfolioPoint[] =>
  Array.from({ length: days }, (_, i) => {
    const a = days <= 1 ? 1 : i / (days - 1)
    const smoothstep = a * a * (3 - 2 * a)
    return { date: String(i + 1), value: start + (end - start) * smoothstep }
  })

const PLACEHOLDER_CHART = trendCurve(250, 1000, 30)

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
}

export const EarnBalance = ({ earningFiatValue, bestApyBps, pricesError, projected }: EarnBalanceProps) => {
  const isEarning = (earningFiatValue ?? 0) > 0
  const earned = isEarning ? TOTAL_EARNED_MOCK : 0
  const changeUsd = (earningFiatValue ?? 0) * (MOCK_CHANGE_PCT / 100)

  return (
    <SurfaceCard className="grid gap-6 rounded-3xl p-6 md:gap-8 md:p-8 lg:grid-cols-2">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium leading-5 text-muted-foreground">Earn balance</span>
          {isEarning && bestApyBps != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-chart-positive px-2.5 py-1 text-xs font-semibold text-white">
              {formatApyBps(bestApyBps)} APY
            </span>
          )}
        </div>

        {pricesError ? (
          <span className="mt-3 text-6xl font-semibold tracking-tight text-foreground">-</span>
        ) : earningFiatValue === undefined ? (
          <Skeleton className="mt-3 h-14 w-48 rounded-md" />
        ) : (
          <BalanceAmount value={earningFiatValue} className="mt-3 text-6xl" />
        )}

        {isEarning && (
          <span className="mt-2 text-sm font-medium text-chart-positive">
            +{formatFiat(changeUsd)} (+{MOCK_CHANGE_PCT.toFixed(2)}%)
          </span>
        )}

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
      </div>

      <div className="flex items-center">
        {isEarning ? (
          <div className="w-full">
            <PortfolioChart />
          </div>
        ) : (
          <div className="w-full">
            <div aria-hidden className="pointer-events-none opacity-25 grayscale">
              <PortfolioChart data={PLACEHOLDER_CHART} />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Your performance chart appears once you start earning.
            </p>
          </div>
        )}
      </div>
    </SurfaceCard>
  )
}
