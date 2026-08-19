import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'

export type PortfolioPoint = { date: string; value: number }

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
