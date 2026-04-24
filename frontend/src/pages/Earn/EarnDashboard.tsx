import { BookCopy, KeySquare, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import HeroImage from '../../assets/dashboard-hero.svg'

const features = [
  { icon: BookCopy, text: 'Earn in one click' },
  { icon: KeySquare, text: 'Your funds stay in your vault' },
  { icon: LogOut, text: 'Stop anytime, no lock-ups' },
]

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
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-6">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-input-focused text-2xl font-medium leading-none">Earn like the pros</p>
              <h2 className="text-foreground text-3xl font-semibold leading-9">
                Put idle allowances to work.
              </h2>
            </div>
            <p className="text-muted-foreground text-xl font-normal leading-7">
              Your allowance earns up to <span className="font-bold text-chart-positive">4.8%</span> yield
              automatically while sitting in the vault. Funds are deployed to trusted protocols (Aave,
              Compound). You can recall at any time — no lock-ups.
            </p>
          </div>

          <div className="flex flex-row flex-wrap gap-6">
            <Button size="lg" className="w-full md:w-auto">
              Select your strategy
            </Button>
          </div>
        </div>

        <div className="w-full md:w-88 h-76 relative shrink-0">
          <img src={HeroImage} alt="Put idle allowances to work" className="w-full h-full object-contain" />
        </div>
      </div>

      <div className="flex flex-col gap-6 items-center sm:flex-wrap sm:gap-y-6 md:flex-row md:justify-between md:gap-12">
        {features.map(feature => {
          const Icon = feature.icon
          return (
            <div key={feature.text} className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{feature.text}</span>
            </div>
          )
        })}
      </div>

      <Separator />

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
