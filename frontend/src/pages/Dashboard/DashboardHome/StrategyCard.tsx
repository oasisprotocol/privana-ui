import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'
import { GitCompareArrows } from 'lucide-react'
import { FC } from 'react'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'

export interface StrategyInfo {
  id: string
  name: string
  amount: string
  changePercentage: string
  invested: string
  traders: number
  rebalance: string
  chartData: { date: string; value: number }[]
}

export const StrategyCard: FC<StrategyInfo> = ({
  id,
  name,
  amount,
  changePercentage,
  invested,
  traders,
  rebalance,
  chartData,
}) => {
  const isPositive = changePercentage.startsWith('+')
  const gradientId = `strategy-gradient-${id}`

  const chartConfig = {
    value: {
      label: name,
      color: isPositive ? 'var(--color-chart-positive)' : 'var(--color-chart-negative)',
    },
  } satisfies ChartConfig

  return (
    <Card className="flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 p-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="size-6 text-muted-foreground" />
            <span className="text-xl font-medium text-foreground">{name}</span>
          </div>
          <p className="text-lg font-medium">
            <span className="text-muted-foreground">{amount} </span>
            <span className={isPositive ? 'text-chart-positive' : 'text-chart-negative'}>
              {changePercentage}
            </span>
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-8 text-sm font-medium">
          <div className="flex gap-4">
            <span className="text-tertiary-foreground">Invested</span>
            <span className="text-foreground">{invested}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-tertiary-foreground">Traders</span>
            <span className="text-foreground">{traders}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-tertiary-foreground">Rebalance</span>
            <span className="text-foreground font-bold">{rebalance}</span>
          </div>
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-[70px] md:w-50">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
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
      <Button variant="secondary" size="lg">
        Manage
      </Button>
    </Card>
  )
}
