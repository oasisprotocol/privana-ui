import { useEffect, useMemo } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useBalance } from '@oasisprotocol/privana-sdk'
import { useTokenPrices } from '@/api/coin-gecko'
import { useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount, formatFiat, isPositiveAmount } from '@/lib/tokens'
import { cn } from '@/lib/utils'
import { ApyValue } from './ApyValue'
import { ProtocolLabel } from './ProtocolLabel'
import { PROTOCOL_LABELS } from './labels'

const PERCENTS = [25, 50, 75, 100] as const

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
  const protocol = selectedPool ? (PROTOCOL_LABELS[selectedPool.strategy] ?? selectedPool.strategy) : ''
  const tokenSymbol = selectedToken?.token_symbol ?? selectedToken?.token_type_name ?? ''
  const decimals = selectedToken?.token_decimals

  const tokenBalance = useBalance({
    tokenId: (selectedToken?.token_id || undefined) as `0x${string}` | undefined,
    enabled: !!selectedToken,
  })
  const balanceWei = tokenBalance.balanceWei ? BigInt(tokenBalance.balanceWei) : 0n

  const priceTokenIds = useMemo(() => (selectedToken ? [selectedToken.token_id] : []), [selectedToken])
  const { data: prices } = useTokenPrices(priceTokenIds)
  const fiat = useMemo(() => {
    if (!prices || !amount || !selectedToken || selectedToken.token_decimals == null) return undefined
    const price = prices[selectedToken.token_id]
    if (price == null) return undefined
    try {
      const units = parseUnits(amount, selectedToken.token_decimals)
      const asNum = Number(formatUnits(units, selectedToken.token_decimals))
      return Number.isFinite(asNum) ? asNum * price : undefined
    } catch {
      return undefined
    }
  }, [prices, amount, selectedToken])

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

  const percentDisabled = !selectedToken || tokenBalance.isLoading || decimals == null || balanceWei === 0n
  const handlePercent = (pct: number) => {
    if (percentDisabled || decimals == null) return
    const portion = pct === 100 ? balanceWei : (balanceWei * BigInt(pct)) / 100n
    onAmountChange(formatUnits(portion, decimals))
  }

  const handleInput = (next: string) => {
    if (!selectedPool) return
    if (next === '') return onAmountChange('')
    const max = decimals ?? 0
    const pattern = max > 0 ? new RegExp(`^\\d*\\.?\\d{0,${max}}$`) : /^\d*$/
    if (pattern.test(next)) onAmountChange(next)
  }

  const exceedsBalance = useMemo(() => {
    if (!amount || decimals == null) return false
    try {
      return parseUnits(amount, decimals) > balanceWei
    } catch {
      return false
    }
  }, [amount, decimals, balanceWei])

  const canReview = !!selectedPool && isPositiveAmount(amount, decimals) && !exceedsBalance

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

      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-baseline justify-center gap-2">
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            disabled={!selectedPool}
            onChange={e => handleInput(e.target.value)}
            size={Math.max(1, amount.length)}
            aria-label="Amount to deposit"
            className="bg-transparent text-center text-5xl font-semibold tracking-tight tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
          />
          {tokenSymbol && <span className="text-xl font-semibold text-muted-foreground">{tokenSymbol}</span>}
        </div>
        <p className="text-sm text-muted-foreground">
          Available:{' '}
          {tokenBalance.isLoading ? (
            <Skeleton className="inline-block h-4 w-24 align-middle" />
          ) : (
            <span className="font-medium text-foreground">{availableLabel}</span>
          )}
        </p>
        <div className="h-4 text-xs">
          {exceedsBalance ? (
            <span className="text-destructive">Exceeds balance</span>
          ) : fiat != null ? (
            <span className="text-muted-foreground">≈ {formatFiat(fiat)}</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {PERCENTS.map(pct => (
          <button
            key={pct}
            type="button"
            disabled={percentDisabled}
            onClick={() => handlePercent(pct)}
            className="h-8 rounded-full bg-white px-4 text-sm font-medium text-foreground shadow-[0_0.5px_1.5px_0_rgba(0,0,0,0.25),0_3.5px_7px_0_rgba(0,0,0,0.08)] transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-card"
          >
            {pct}%
          </button>
        ))}
      </div>

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
