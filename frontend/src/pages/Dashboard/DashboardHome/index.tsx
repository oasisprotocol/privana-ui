import { Button } from '@/components/ui/button'
import { GitCompareArrows, GitCompare, Wand } from 'lucide-react'
import { PortfolioCard } from './PortfolioCard'

export const DashboardHome = () => {
  return (
    <>
      <div className="flex flex-col gap-6 mb-8 md:mb-24">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xl font-semibold text-tertiary-foreground">Wallet connected</h3>
          <h2 className="max-w-md text-3xl font-medium text-card-foreground">
            Start your private trading journey, FlexVaults
          </h2>
        </div>
        <Button onClick={() => {}} type="button" className="w-35" size="lg">
          Start
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <PortfolioCard title="Copy trading" amount="0$" changePercentage="+0%" icon={<GitCompareArrows />} />
        <PortfolioCard title="Spot trading" amount="0$" changePercentage="+0%" icon={<GitCompare />} />
        <PortfolioCard title="AI trading" amount="0$" changePercentage="0%" icon={<Wand />} disabled />
      </div>
    </>
  )
}
