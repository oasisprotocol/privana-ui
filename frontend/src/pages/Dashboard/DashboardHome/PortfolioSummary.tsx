import { PoweredByHyperliquid } from '@/components/PoweredByHyperliquid'
import { FC } from 'react'
import { StrategyCard, StrategyInfo } from './StrategyCard'

// TODO: Replace with real data when API returns investments
const mockStrategies: StrategyInfo[] = [
  {
    id: '1',
    name: 'Blue Chip Mirrors',
    amount: '$7,101.00',
    changePercentage: '+7.3%',
    invested: '$7,000.00',
    traders: 3,
    rebalance: 'Daily',
    chartData: [
      { date: 'Mon', value: 5800 },
      { date: 'Tue', value: 6200 },
      { date: 'Wed', value: 5900 },
      { date: 'Thu', value: 6800 },
      { date: 'Fri', value: 7100 },
    ],
  },
  {
    id: '2',
    name: 'Degen Plays',
    amount: '$7,101.00',
    changePercentage: '-2.3%',
    invested: '$7,000.00',
    traders: 3,
    rebalance: 'Daily',
    chartData: [
      { date: 'Mon', value: 7500 },
      { date: 'Tue', value: 7200 },
      { date: 'Wed', value: 7800 },
      { date: 'Thu', value: 7000 },
      { date: 'Fri', value: 7100 },
    ],
  },
]

export const PortfolioSummary: FC = () => {
  return (
    <>
      {/* TODO: Condition when API returns no investments */}
      <div className="flex flex-col justify-start items-start gap-1.5">
        <div className="text-foreground text-2xl font-medium">Nothing in your portfolio yet.</div>
        <div className="text-muted-foreground text-sm font-normal">Create your first investment.</div>
      </div>

      {/* TODO: Condition when API returns investments */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col justify-start items-start gap-1.5">
          <div className="text-foreground text-2xl font-medium">Your portfolio</div>
          <div className="text-muted-foreground text-sm font-normal">
            Quick overview of your investments and change over time
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="text-muted-foreground text-[15px] font-bold uppercase">Copy Trading</div>
          {mockStrategies.map(strategy => (
            <StrategyCard key={strategy.id} {...strategy} />
          ))}
        </div>
      </div>

      <PoweredByHyperliquid />
    </>
  )
}
