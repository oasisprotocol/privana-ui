import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'

const data = [
  { date: 'Mon', value: 1200 },
  { date: 'Tue', value: 3100 },
  { date: 'Wed', value: 2400 },
  { date: 'Thu', value: 1800 },
  { date: 'Fri', value: 3500 },
]

const chartConfig = {
  value: {
    label: 'Portfolio',
    color: 'var(--color-chart-positive)',
  },
} satisfies ChartConfig

export const PortfolioChart = () => {
  return (
    <ChartContainer config={chartConfig} className="h-46 w-118">
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
