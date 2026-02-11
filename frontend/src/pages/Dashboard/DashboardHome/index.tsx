import { Button } from '@/components/ui/button'
import { GitCompareArrows, GitCompare, Wand } from 'lucide-react'
import { PortfolioCard } from './PortfolioCard'
import { Separator } from '@/components/ui/separator'
import { PortfolioChange } from './PortfolioChange'
import { PortfolioChart } from './PortfolioChart'

export const DashboardHome = () => {
  const hasFunds = true // get from SDK

  return (
    <>
      <div className="flex flex-col gap-6 mb-8 md:mb-24">
        {!hasFunds && (
          <>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-xl font-semibold text-tertiary-foreground">Wallet connected</h3>
              <h2 className="max-w-md text-3xl font-medium text-card-foreground">
                Start your private trading journey, FlexVaults
              </h2>
            </div>
            <Button onClick={() => {}} type="button" className="w-35" size="lg">
              Start
            </Button>
          </>
        )}
        {hasFunds && (
          <div className="flex justify-between flex-col md:flex-row items-center">
            <div className="w-full md:w-auto md:max-w-78 flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xl font-semibold text-tertiary-foreground">Available</h3>
                <h2 className="max-w-md text-3xl font-medium text-card-foreground">2.000,00$</h2>
              </div>
              <div className="flex gap-3">
                <Button variant="outline">Deposit</Button>
                <Button variant="outline">Withdraw</Button>
                <Button variant="outline">See activity</Button>
              </div>
              <Separator />
              <div className="flex flex-col gap-0.75">
                <div className="text-tertiary-foreground text-xl font-semibold">Total invested balance</div>
                <PortfolioChange amount="0$" changePercentage="+0%" />
              </div>
            </div>
            <PortfolioChart />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <PortfolioCard title="Copy trading" amount="0$" changePercentage="+0%" icon={<GitCompareArrows />} />
        <PortfolioCard title="Spot trading" amount="0$" changePercentage="+0%" icon={<GitCompare />} />
        <PortfolioCard title="AI trading" amount="0$" changePercentage="0%" icon={<Wand />} disabled />
      </div>
    </>
  )
}
