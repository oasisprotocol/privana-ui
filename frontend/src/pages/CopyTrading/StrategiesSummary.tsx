import { PoweredByHyperliquid } from '@/components/PoweredByHyperliquid'
import { FC } from 'react'
import { CopyTradingStrategyCard, CopyTradingStrategyInfo } from './CopyTradingStrategyCard'

// TODO: Replace with real data from API
const mockStrategies: CopyTradingStrategyInfo[] = [
  {
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
  },
  {
    id: '2',
    name: 'Random picks',
    totalValue: '$3,020.00',
    change: '-$234.5 (-2.3%)',
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
    ],
    chartData: [
      { date: 'Mon', value: 3500 },
      { date: 'Tue', value: 3300 },
      { date: 'Wed', value: 3600 },
      { date: 'Thu', value: 3100 },
      { date: 'Fri', value: 3400 },
      { date: 'Sat', value: 3200 },
      { date: 'Sun', value: 3020 },
    ],
  },
]

export const StrategiesSummary: FC = () => {
  return (
    <>
      {/* TODO: Condition when API returns empty strategy list */}
      <div className="flex flex-col justify-start items-start gap-1.5">
        <div className="text-foreground text-2xl font-medium">No active strategies yet.</div>
        <div className="text-muted-foreground text-sm font-normal">Create your first strategy.</div>
      </div>

      {/* TODO: Condition when API returns strategies */}
      <div className="flex flex-col gap-16">
        <div className="flex flex-col justify-start items-start gap-1.5">
          <div className="text-foreground text-2xl font-medium">Your active strategies</div>
          <div className="text-muted-foreground text-sm font-normal max-w-83">
            Select traders whose moves you want to mirror. Diversify across different styles for balanced
            risk.
          </div>
        </div>

        <div className="flex flex-col gap-16">
          {mockStrategies.map(strategy => (
            <CopyTradingStrategyCard key={strategy.id} {...strategy} />
          ))}
        </div>
      </div>

      <PoweredByHyperliquid />
    </>
  )
}
