import { Button } from '@/components/ui/button'
import { GitCompare, ArrowDownToLine, ArrowUpToLine, History, Percent } from 'lucide-react'
import { PortfolioCard } from './PortfolioCard'
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
import { tradePath } from '@/paths'

export const DashboardHome = () => {
  const [modalOpen, setModalOpen] = useState<ComponentProps<typeof FlexvaultsModal>['defaultTab']>(undefined)
  const { enabledTokens, tokensStatus } = useFlexvaultsContext()
  const tokenIds = useMemo(() => enabledTokens.map(t => t.id), [enabledTokens])
  const { balances, isLoading } = useBatchBalances({ tokenIds })
  const pending = tokensStatus !== 'ready' || isLoading
  const { locks } = useLockedFunds()
  const { data: prices, isPending: pricesPending, isError: pricesError } = useTokenPrices(tokenIds)

  const { availableFiatValue, totalFiatValue } = useMemo(() => {
    // TODO: take into account yield, pending etc when API is ready
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
  // TODO: take into account yield, pending etc when API is ready
  const hasFunds = balances.some(b => BigInt(b.balance || '0') > 0n)
  const handleStartWithoutFunds = () => {
    setAlertOpen(true)
  }

  return (
    <>
      <div className="flex flex-col gap-6 mb-8 md:mb-12">
        {pending && <Skeleton className="h-70 w-full" />}
        {!pending && !hasFunds && (
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
        {!pending && hasFunds && (
          <div className="flex flex-col gap-6">
            <div className="flex md:justify-end">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 rounded-lg border bg-card p-3 w-full md:w-auto">
                <div className="flex md:items-center gap-3 text-base font-medium">
                  <span className="text-secondary-foreground">Available funds</span>
                  {pricesError ? (
                    <span className="text-foreground" title="Token prices are temporarily unavailable.">
                      -
                    </span>
                  ) : pricesPending || availableFiatValue === undefined ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <span className="text-foreground">{formatFiat(availableFiatValue)}</span>
                  )}
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
                  <h2
                    className="text-3xl font-medium text-card-foreground"
                    title={pricesError ? 'Token prices are temporarily unavailable.' : undefined}
                  >
                    {pricesError ? '-' : formatFiat(totalFiatValue ?? 0)}
                  </h2>
                  <span className="text-lg font-semibold text-chart-positive">+$0.00 (+0%)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-24 w-full">
        <PortfolioCard
          buttonAction={hasFunds ? undefined : handleStartWithoutFunds}
          icon={<GitCompare />}
          title="Swap"
          buttonLabel="Make your private swap"
          to={tradePath()}
        />
        <PortfolioCard title="Earn" icon={<Percent />} buttonLabel="Check out earning strategies" disabled />
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
