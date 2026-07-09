import { useId } from 'react'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

const data = [
  { date: '1', value: 1 },
  { date: '2', value: 1 },
  { date: '3', value: 1 },
  { date: '4', value: 1 },
  { date: '5', value: 1 },
  { date: '6', value: 1 },
  { date: '7', value: 1 },
  { date: '8', value: 1 },
]

const chartConfig = {
  value: {
    label: 'APY',
    color: 'var(--color-chart-positive)',
  },
} satisfies ChartConfig

export const VenueAPY = ({ className }: { className?: string }) => {
  const gradientId = useId()

  return (
    <ChartContainer config={chartConfig} className={cn('h-10 w-36', className)}>
      <AreaChart data={data} margin={{ top: 3, right: 0, bottom: 3, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ChartContainer>
  )
}
