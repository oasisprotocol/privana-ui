import { useId } from 'react'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { useApyHistory, type ApyHistoryPoint } from '@/api/earn'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const chartConfig = {
  apy_bps: { label: 'APY', color: 'var(--color-chart-positive)' },
} satisfies ChartConfig

const placeholderConfig = {
  apy_bps: { label: 'APY', color: 'var(--color-tertiary-foreground)' },
} satisfies ChartConfig

const PLACEHOLDER: ApyHistoryPoint[] = Array.from({ length: 8 }, (_, i) => ({
  timestamp: i,
  apy_bps: 1,
}))

export const VenueAPY = ({ poolId, className }: { poolId: string; className?: string }) => {
  const gradientId = useId()
  const { data, isLoading } = useApyHistory(poolId)

  if (isLoading) {
    return <Skeleton className={cn('h-10 w-36', className)} />
  }

  const points = data?.points ?? []
  const isPlaceholder = points.length < 2

  return (
    <ChartContainer
      config={isPlaceholder ? placeholderConfig : chartConfig}
      className={cn('h-10 w-36', className)}
    >
      <AreaChart
        data={isPlaceholder ? PLACEHOLDER : points}
        margin={{ top: 3, right: 0, bottom: 3, left: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-apy_bps)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-apy_bps)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="timestamp" hide />
        <YAxis domain={isPlaceholder ? [0, 2] : ['dataMin', 'dataMax']} hide />
        <Area
          dataKey="apy_bps"
          type="monotone"
          stroke="var(--color-apy_bps)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
