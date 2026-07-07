import { useState } from 'react'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

const RANGES = ['1M', '3M', '6M', '1Y', 'All'] as const
type Range = (typeof RANGES)[number]

const data = [
  { date: '1', value: 1000 },
  { date: '2', value: 1008 },
  { date: '3', value: 1004 },
  { date: '4', value: 1018 },
  { date: '5', value: 1012 },
  { date: '6', value: 1030 },
  { date: '7', value: 1075 },
  { date: '8', value: 1180 },
]

const chartConfig = {
  value: {
    label: 'Portfolio',
    color: 'var(--color-chart-positive)',
  },
} satisfies ChartConfig

export const PortfolioChart = () => {
  const [range, setRange] = useState<Range>('1M')

  return (
    <div className="flex flex-col gap-3">
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
          <Area
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={2}
            fill="url(#portfolioGradient)"
          />
        </AreaChart>
      </ChartContainer>

      <div className="flex w-full gap-1">
        {RANGES.map(r => {
          const active = r === range
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={active}
              className={cn(
                'flex-1 rounded-full py-1 text-xs font-semibold tracking-wide transition-colors',
                active
                  ? 'bg-secondary dark:bg-[#2d3139] text-secondary-foreground dark:text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r}
            </button>
          )
        })}
      </div>
    </div>
  )
}
