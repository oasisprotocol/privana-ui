import { Button } from '@/components/ui/button'
import { EarnHeader } from './EarnHeader'

const strategies = [
  { id: 'max-yield', name: 'Max Yield Strategy', apyLabel: '+4.8%', asset: 'USDC', chain: 'Ethereum' },
]

const protocols = [{ id: 'aave', name: 'AAVE', apyLabel: '+4.8%', asset: 'USDC', chain: 'Ethereum' }]

type YieldCardProps = {
  name: string
  apyLabel: string
  asset: string
  chain: string
}

const YieldCard = ({ name, apyLabel, asset, chain }: YieldCardProps) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border p-8 rounded-lg">
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex flex-col gap-1">
        <p className="text-xl font-medium text-foreground">{name}</p>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">APY</span>
          <span className="text-chart-positive text-lg">{apyLabel}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-sm font-medium">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Asset</span>
          <span className="text-foreground">{asset}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Protocol</span>
          <span className="text-foreground">{chain}</span>
        </div>
      </div>
    </div>
    <Button size="lg" className="w-full md:w-35">
      Select
    </Button>
  </div>
)

export const EarnDashboard = () => {
  return (
    <>
      <EarnHeader
        action={
          <Button size="lg" className="w-full md:w-auto">
            Select your strategy
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        <p className="text-[15px] font-bold text-muted-foreground uppercase">Diversified Yield strategies</p>
        {strategies.map(s => (
          <YieldCard key={s.id} {...s} />
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <p className="text-[15px] font-bold text-muted-foreground uppercase">Available protocols</p>
        {protocols.map(p => (
          <YieldCard key={p.id} {...p} />
        ))}
      </div>
    </>
  )
}
