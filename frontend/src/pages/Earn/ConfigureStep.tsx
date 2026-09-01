import { useEffect } from 'react'
import { useBalance } from '@oasisprotocol/privana-sdk'
import { useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { exceedsAmount, formatAmount, isPositiveAmount } from '@/lib/tokens'
import { cn } from '@/lib/utils'
import { ApyValue } from './ApyValue'
import { EarnAmountField } from './EarnAmountField'
import { ProtocolLabel } from './ProtocolLabel'
import { getProtocolLabel } from '@/config/protocols'

type ConfigureStepProps = {
  poolId: string | undefined
  amount: string
  strategyLocked?: boolean
  onPoolIdChange: (id: string | undefined) => void
  onAmountChange: (v: string) => void
  onReview: () => void
}

export const ConfigureStep = ({
  poolId,
  amount,
  strategyLocked,
  onPoolIdChange,
  onAmountChange,
  onReview,
}: ConfigureStepProps) => {
  const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading, error: tokensError } = useTokens()
  const isLoading = poolsLoading || tokensLoading
  const pools = poolsData?.pools ?? []

  const activePools = pools.filter(p => p.status === 'active')
  const tokensById = new Map((tokensData?.tokens ?? []).map(t => [t.token_id, t]))
  const selectedPool = activePools.find(p => p.pool_id === poolId)
  const selectedToken = selectedPool ? tokensById.get(selectedPool.token_id) : undefined
  const protocol = selectedPool ? getProtocolLabel(selectedPool.strategy) : ''
  const tokenSymbol = selectedToken?.token_symbol ?? selectedToken?.token_type_name ?? ''
  const decimals = selectedToken?.token_decimals

  const tokenBalance = useBalance({
    tokenId: (selectedToken?.token_id || undefined) as `0x${string}` | undefined,
    enabled: !!selectedToken,
  })
  const balanceWei = tokenBalance.balanceWei ? BigInt(tokenBalance.balanceWei) : 0n

  // Keep a venue selected: drop a stale URL poolId, otherwise default to the first
  // active pool so the amount/chips/"Available" line always have a context.
  useEffect(() => {
    if (isLoading) return
    if (poolId && !activePools.some(p => p.pool_id === poolId)) {
      onPoolIdChange(undefined)
    } else if (!poolId && !strategyLocked && activePools.length > 0) {
      onPoolIdChange(activePools[0].pool_id)
    }
  }, [isLoading, poolId, strategyLocked, activePools, onPoolIdChange])

  const canReview =
    !!selectedPool && isPositiveAmount(amount, decimals) && !exceedsAmount(amount, decimals, balanceWei)

  const availableLabel =
    selectedToken && decimals != null ? `${formatAmount(balanceWei, decimals)} ${tokenSymbol}` : '-'

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-110 mx-auto">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-6 h-14 w-40" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (poolsError || tokensError) {
    return <p className="text-center text-destructive">Unable to load earn pools</p>
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-110 mx-auto">
      <h2 className="text-xl font-semibold text-foreground">
        {selectedPool ? `Move to ${protocol}` : 'Add funds'}
      </h2>

      <EarnAmountField
        amount={amount}
        onAmountChange={onAmountChange}
        token={selectedToken}
        maxWei={balanceWei}
        disabled={!selectedPool}
        ariaLabel="Amount to deposit"
        sublabel={
          <>
            Available:{' '}
            {tokenBalance.isLoading ? (
              <Skeleton className="inline-block h-4 w-24 align-middle" />
            ) : (
              <span className="font-medium text-foreground">{availableLabel}</span>
            )}
          </>
        }
      />

      {activePools.length > 0 && (
        <div className="flex w-full flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Earn with</p>
          <div className="flex items-stretch gap-2">
            {activePools.map(p => {
              const selected = p.pool_id === poolId
              return (
                <button
                  key={p.pool_id}
                  type="button"
                  onClick={() => onPoolIdChange(p.pool_id)}
                  disabled={strategyLocked && !selected}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-2xl border bg-white px-3 py-3.5 text-sm font-semibold text-foreground transition-colors disabled:opacity-50 dark:bg-card',
                    selected ? 'border-foreground' : 'border-border hover:border-muted-foreground',
                  )}
                >
                  <ProtocolLabel strategy={p.strategy} iconSize={20} />
                  <ApyValue bps={p.apy_bps} className="text-xs font-semibold" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <Button size="lg" className="mt-2 h-12 w-full text-base" disabled={!canReview} onClick={onReview}>
        Review
      </Button>
    </div>
  )
}
