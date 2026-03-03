import { Button } from '@/components/ui/button'
import { GitCompareArrows, GitCompare, Wand, ArrowDownToLine, ArrowUpToLine, History } from 'lucide-react'
import { PortfolioCard } from './PortfolioCard'
import { PortfolioChart } from './PortfolioChart'
import { ComponentProps, useState } from 'react'
import { FlexvaultsModal, useBalance } from '@oasisprotocol/flexvaults-sdk'
import { formatUnits } from 'viem'
import { Skeleton } from '@/components/ui/skeleton'
import { PortfolioSummary } from './PortfolioSummary'
import { DepositAlertDialog } from './DepositAlertDialog'

export const DashboardHome = () => {
  const [modalOpen, setModalOpen] = useState<ComponentProps<typeof FlexvaultsModal>['defaultTab']>(undefined)
  const { balanceWei, isLoading } = useBalance({
    tokenId: import.meta.env.VITE_USDC_TOKEN_ID,
  })
  const [alertOpen, setAlertOpen] = useState(false)
  const hasFunds = BigInt(balanceWei || 0) > 0
  const handleStart = () => {
    setAlertOpen(true)
  }

  return (
    <>
      <div className="flex flex-col gap-6 mb-8 md:mb-12">
        {isLoading && <Skeleton className="h-70 w-full" />}
        {!isLoading && !hasFunds && (
          <>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-xl font-semibold text-tertiary-foreground">Wallet connected</h3>
              <h2 className="max-w-md text-3xl font-medium text-card-foreground">
                Start your private trading journey, FlexVaults
              </h2>
            </div>
            <Button className="w-full md:w-35" size="lg" onClick={handleStart}>
              Start
            </Button>
          </>
        )}
        {!isLoading && hasFunds && (
          <div className="flex flex-col gap-6">
            <div className="flex md:justify-end">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 rounded-lg border bg-card p-3 w-full md:w-auto">
                <div className="flex md:items-center gap-3 text-base font-medium">
                  <span className="text-secondary-foreground">Available funds</span>
                  <span className="text-foreground">
                    $
                    {Number(
                      formatUnits(BigInt(balanceWei), Number(import.meta.env.VITE_USDC_DECIMALS)),
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="xs" onClick={() => setModalOpen('deposit')}>
                    <ArrowDownToLine />
                    Deposit
                  </Button>
                  <Button variant="secondary" size="xs" onClick={() => setModalOpen('withdraw')}>
                    <ArrowUpToLine />
                    Withdraw
                  </Button>
                  <Button variant="secondary" size="xs">
                    <History />
                    See activity
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row justify-between lg:items-center">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <h3 className="text-xl font-semibold text-tertiary-foreground">Total balance</h3>
                  <h2 className="text-3xl font-medium text-card-foreground">
                    $
                    {Number(
                      formatUnits(BigInt(balanceWei), Number(import.meta.env.VITE_USDC_DECIMALS)),
                    ).toFixed(2)}
                  </h2>
                  <span className="text-lg font-semibold text-chart-positive">+$0.00 (+0%)</span>
                </div>
              </div>
              <PortfolioChart />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <PortfolioCard
          amount="0$"
          buttonAction={hasFunds ? undefined : handleStart}
          buttonLabel="Create your first strategy"
          changePercentage="+0%"
          disabled={isLoading}
          icon={<GitCompareArrows />}
          title="Copy trading"
          to="/copy-trading/create"
        />
        <PortfolioCard
          amount="0$"
          buttonAction={hasFunds ? undefined : handleStart}
          changePercentage="+0%"
          disabled
          icon={<GitCompare />}
          title="Spot trading"
        />
        <PortfolioCard title="AI trading" amount="0$" changePercentage="0%" icon={<Wand />} disabled />
      </div>

      <PortfolioSummary />

      <DepositAlertDialog
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        onDeposit={() => setModalOpen('deposit')}
      />

      <FlexvaultsModal
        open={!!modalOpen}
        onClose={() => setModalOpen(undefined)}
        showLockedFunds={false}
        defaultTab={modalOpen}
      />
    </>
  )
}
