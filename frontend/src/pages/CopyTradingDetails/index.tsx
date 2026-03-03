import { useParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { PoweredByHyperliquid } from '@/components/PoweredByHyperliquid'
import { type CopyTradingStrategyInfo } from '../CopyTrading/CopyTradingStrategyCard'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StrategyChart } from './StrategyChart'

// TODO: Replace with real data from API
const strategy: CopyTradingStrategyInfo = {
  id: '1',
  name: 'Blue Chip DeFi Mix',
  totalValue: '$7,101.00',
  change: '+$577.00 (+5.4%)',
  allocationDrift: '1.2% from target',
  nextRebalance: 'in 4 hours',
  sharpeRatio: '1.42',
  maxDrawdown: '-8.3%',
  winRate: '67%',
  avgTradeSize: '1,240',
  totalTrades: 156,
  traders: [
    {
      address: '0x71F3...a92b',
      initialPosition: '20%',
      currentPosition: '27%',
      amount: '241d',
      pnl30d: '+12.242',
    },
    {
      address: '0x9c4a...2Fe9',
      initialPosition: '60%',
      currentPosition: '55%',
      amount: '187d',
      pnl30d: '+2.242',
    },
  ],
  chartData: [
    { date: 'Mon', value: 6200 },
    { date: 'Tue', value: 6500 },
    { date: 'Wed', value: 6300 },
    { date: 'Thu', value: 7000 },
    { date: 'Fri', value: 6800 },
    { date: 'Sat', value: 7200 },
    { date: 'Sun', value: 7100 },
  ],
}

export const CopyTradingDetails = () => {
  // @ts-expect-error id will be used once API is ready
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = useParams<{ id: string }>()
  const isLoading = false

  return (
    <>
      <div className="flex flex-col gap-6 mb-8 md:mb-12">
        {isLoading && <Skeleton className="h-70 w-full" />}
        {!isLoading && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-tertiary-foreground uppercase">
                      {strategy.name}
                    </h3>
                    <h2 className="text-3xl font-medium text-card-foreground">{strategy.totalValue}</h2>
                    <span className="text-lg font-semibold text-chart-positive">{strategy.change}</span>
                  </div>
                </div>
              </div>
              <StrategyChart data={strategy.chartData} />
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-16">
        <div className="flex flex-col justify-start items-start gap-1.5">
          <div className="text-foreground text-2xl font-medium">Copy trading structure</div>
          <div className="text-muted-foreground text-sm font-normal max-w-83">
            Select traders whose moves you want to mirror. Diversify across different styles for balanced
            risk.
          </div>
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
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading &&
              strategy.traders.map(trader => (
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
      </div>

      <div className="flex justify-center">
        <Button size="lg" className="w-full md:w-70" onClick={() => {}}>
          Rebalance
        </Button>
      </div>

      <PoweredByHyperliquid />
    </>
  )
}
