import { Card } from '@/components/ui/card'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FC } from 'react'
import { useNavigate } from 'react-router'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { Button } from '@oasisprotocol/flexvaults-sdk'

export interface TraderInfo {
  address: string
  initialPosition: string
  currentPosition: string
  amount: string
  pnl30d: string
}

export interface CopyTradingStrategyInfo {
  id: string
  name: string
  totalValue: string
  change: string
  allocationDrift: string
  nextRebalance: string
  sharpeRatio: string
  maxDrawdown: string
  winRate: string
  avgTradeSize: string
  totalTrades: number
  traders: TraderInfo[]
  chartData: { date: string; value: number }[]
}

export const CopyTradingStrategyCard: FC<CopyTradingStrategyInfo> = ({
  id,
  name,
  totalValue,
  change,
  allocationDrift,
  nextRebalance,
  sharpeRatio,
  maxDrawdown,
  winRate,
  avgTradeSize,
  totalTrades,
  traders,
  chartData,
}) => {
  const navigate = useNavigate()
  const isPositive = change.startsWith('+')
  const gradientId = `copy-strategy-gradient-${id}`

  const chartConfig = {
    value: {
      label: name,
      color: isPositive ? 'var(--color-chart-positive)' : 'var(--color-chart-negative)',
    },
  } satisfies ChartConfig

  return (
    <Card className="flex-col gap-6 border-none bg-transparent p-0 shadow-none">
      <div className="flex items-center justify-between gap-12">
        <div className="flex min-w-55 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xl font-medium text-foreground">{name}</span>
              <p className="text-base font-medium">
                <span className="text-muted-foreground">{totalValue} </span>
                <span className={isPositive ? 'text-chart-positive' : 'text-chart-negative'}>{change}</span>
              </p>
            </div>

            <div className="flex flex-col text-sm font-medium">
              <div className="flex gap-4">
                <span className="text-tertiary-foreground">Allocation drift</span>
                <span className="text-foreground">{allocationDrift}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-tertiary-foreground">Next auto-rebalance</span>
                <span className="text-foreground">{nextRebalance}</span>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col text-sm font-medium">
              <div className="flex gap-4">
                <span className="text-tertiary-foreground">Sharpe ratio</span>
                <span className="text-foreground">{sharpeRatio}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-tertiary-foreground">Max drawdown</span>
                <span className="text-foreground">{maxDrawdown}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-tertiary-foreground">Win rate</span>
                <span className="text-foreground">{winRate}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-tertiary-foreground">Avg. trade size</span>
                <span className="text-foreground">{avgTradeSize}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-tertiary-foreground">Total trades</span>
                <span className="text-foreground">{totalTrades}</span>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={() => navigate(`/copy-trading/${id}`)}>
            Manage
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trader</TableHead>
              <TableHead>Initial position</TableHead>
              <TableHead>Current position</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>30d PnL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {traders.map(trader => (
              <TableRow key={trader.address}>
                <TableCell>{trader.address}</TableCell>
                <TableCell>{trader.initialPosition}</TableCell>
                <TableCell>{trader.currentPosition}</TableCell>
                <TableCell>{trader.amount}</TableCell>
                <TableCell>{trader.pnl30d}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <ChartContainer config={chartConfig} className="aspect-auto h-[112px] w-[200px]">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  )
}
