import { Button } from '@/components/ui/button'
import { GitCompareArrows, GitCompare, Wand, ArrowDownToLine, ArrowUpToLine, History } from 'lucide-react'
import { PortfolioCard } from './PortfolioCard'
import { PortfolioChart } from './PortfolioChart'
import { ComponentProps, useMemo, useState } from 'react'
import {
  FlexvaultsModal,
  useBatchBalances,
  useFlexvaultsContext,
  useLockedFunds,
} from '@oasisprotocol/flexvaults-sdk'
import { formatUnits } from 'viem'
import { Skeleton } from '@/components/ui/skeleton'
import { PortfolioSummary } from './PortfolioSummary'
import { DepositAlertDialog } from './DepositAlertDialog'
import { useTokenPrices } from '@/api/coin-gecko'
import { formatFiat } from '@/lib/tokens'

export const DashboardHome = () => {
  const [modalOpen, setModalOpen] = useState<ComponentProps<typeof FlexvaultsModal>['defaultTab']>(undefined)
  const { enabledTokens } = useFlexvaultsContext()
  const tokenIds = useMemo(() => enabledTokens.map(t => t.id), [enabledTokens])
  const { balances, isLoading } = useBatchBalances({ tokenIds })
  const { locks } = useLockedFunds()
  const { data: prices } = useTokenPrices(tokenIds)

  const { availableFiatValue, totalFiatValue } = useMemo(() => {
    if (!prices) return { availableFiatValue: undefined, totalFiatValue: undefined }
    let available = 0
    let total = 0
    for (const b of balances) {
      const price = prices[b.token_id]
      if (price == null) continue
      // TODO: temporary workaround, remove once SDK returns decimals
      const decimals = b.token_symbol === 'WETH' ? 18 : 6
      const availableAmount = Number(formatUnits(BigInt(b.balance || '0'), decimals))
      const lockedAmount = locks
        .filter(l => l.token_id === b.token_id)
        .reduce((sum, l) => sum + Number(formatUnits(BigInt(l.amount), decimals)), 0)
      available += availableAmount * price
      total += (availableAmount + lockedAmount) * price
    }
    return { availableFiatValue: available, totalFiatValue: total }
  }, [balances, locks, prices])
  const [alertOpen, setAlertOpen] = useState(false)
  const hasFunds = balances.some(b => BigInt(b.balance || '0') > 0n)
  const handleStartWithoutFunds = () => {
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
            <Button className="w-full md:w-35" size="lg" onClick={handleStartWithoutFunds}>
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
                  <span className="text-foreground">{formatFiat(availableFiatValue ?? 0)}</span>
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
                    {formatFiat(totalFiatValue ?? 0)}
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
          buttonAction={hasFunds ? undefined : handleStartWithoutFunds}
          changePercentage="+0%"
          icon={<GitCompare />}
          title="Spot trading"
          buttonLabel="Trade"
          to="/swap"
        />
        <PortfolioCard
          amount="0$"
          buttonAction={hasFunds ? undefined : handleStartWithoutFunds}
          buttonLabel="Create your first strategy"
          changePercentage="+0%"
          icon={<GitCompareArrows />}
          title="Copy trading"
          disabled
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
