import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatFiat } from '@/lib/tokens'

export type PortfolioPoint = { date: string; value: number }

// Empty-state placeholder curve — matches the design's dimmed "trend" chart: a
// smoothstep S-curve from startValueUsd → endValueUsd over `days` points.
const trendCurve = (start: number, end: number, days: number): PortfolioPoint[] =>
  Array.from({ length: days }, (_, i) => {
    const a = days <= 1 ? 1 : i / (days - 1)
    const smoothstep = a * a * (3 - 2 * a)
    return { date: String(i + 1), value: start + (end - start) * smoothstep }
  })

const PLACEHOLDER_DATA = trendCurve(250, 1000, 30)

export const PortfolioChartPlaceholder = ({ label }: { label: string }) => (
  <div className="w-full">
    <div aria-hidden className="pointer-events-none opacity-25 grayscale">
      <PortfolioChart data={PLACEHOLDER_DATA} />
    </div>
    <p className="mt-3 text-center text-xs text-muted-foreground">{label}</p>
  </div>
)

const chartConfig = {
  value: {
    label: 'Portfolio',
    color: 'var(--color-chart-positive)',
  },
} satisfies ChartConfig

export const PortfolioChart = ({ data }: { data: PortfolioPoint[] }) => {
  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis hide />
        <ChartTooltip
          cursor={false}
          allowEscapeViewBox={{ x: false, y: true }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const ts = Number(payload?.[0]?.payload?.date)
                return Number.isFinite(ts)
                  ? new Date(ts * 1000).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : ''
              }}
              formatter={value => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">Value</span>
                  <span className="text-foreground font-mono font-medium tabular-nums">
                    {formatFiat(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill="url(#portfolioGradient)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
