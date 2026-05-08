import { Fragment, useEffect, useMemo } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { getTokenIcon, useBalance } from '@oasisprotocol/flexvaults-sdk'
import { useTokenPrices } from '@/api/coin-gecko'
import { useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StepCard } from '@/components/StepCard'
import { formatAmount, formatFiat, isPositiveAmount } from '@/lib/tokens'
import { cn } from '@/lib/utils'
import { formatApyBps, STRATEGY_LABELS } from './labels'

const PERCENTS = [25, 50, 75, 100] as const
const percentLabel = (pct: number) => (pct === 100 ? 'Max' : `${pct}%`)

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

  const tokenBalance = useBalance({
    tokenId: (selectedToken?.token_id || undefined) as `0x${string}` | undefined,
    enabled: !!selectedToken,
  })
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

  // Drop a stale URL poolId if it isn't present in the loaded pools
  useEffect(() => {
    if (isLoading || !poolId) return
    if (!activePools.some(p => p.pool_id === poolId)) {
      onPoolIdChange(undefined)
    }
  }, [isLoading, poolId, activePools, onPoolIdChange])

  const renderBalance = () => {
    if (!selectedToken) return <span>Balance: -</span>
    if (tokenBalance.isLoading) return <Skeleton className="h-4 w-32" />
    if (selectedToken.token_decimals == null) return <span>Balance: -</span>
    return (
      <span>
        {`Balance: ${formatAmount(BigInt(tokenBalance.balanceWei || '0'), selectedToken.token_decimals)} ${selectedToken.token_symbol ?? selectedToken.token_type_name}`}
      </span>
    )
  }

  const balanceWei = tokenBalance.balanceWei ? BigInt(tokenBalance.balanceWei) : 0n
  const percentDisabled =
    !selectedToken || tokenBalance.isLoading || selectedToken.token_decimals == null || balanceWei === 0n

  const handlePercent = (pct: number) => {
    if (percentDisabled || selectedToken?.token_decimals == null) return
    const portion = pct === 100 ? balanceWei : (balanceWei * BigInt(pct)) / 100n
    onAmountChange(formatUnits(portion, selectedToken.token_decimals))
  }

  const canReview = !!selectedPool && isPositiveAmount(amount, selectedToken?.token_decimals)

  if (isLoading) {
    return (
      <StepCard>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-full max-w-80" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </StepCard>
    )
  }

  if (poolsError || tokensError) {
    return <p className="text-destructive">Unable to load earn pools</p>
  }

  return (
    <StepCard>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-medium text-foreground leading-8">Activate yield</h2>
        <p className="text-sm text-muted-foreground">Select amount and protocol. Recall anytime.</p>
      </div>

      <Select value={poolId} onValueChange={onPoolIdChange} disabled={strategyLocked}>
        <SelectTrigger
          className={cn(
            'w-full data-[size=default]:h-12 px-4 py-3 rounded-[10px] border-0 bg-secondary text-secondary-foreground text-base font-medium *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:justify-center [&>svg]:size-5 [&>svg]:opacity-100 [&>svg]:!text-secondary-foreground',
            strategyLocked && 'disabled:opacity-100 disabled:cursor-default [&>svg]:hidden',
          )}
        >
          <SelectValue placeholder="Select strategy" />
        </SelectTrigger>
        <SelectContent>
          {activePools.map(p => (
            <SelectItem key={p.pool_id} value={p.pool_id}>
              <span>
                {STRATEGY_LABELS[p.strategy] ?? p.strategy}{' '}
                <span className="text-chart-positive">{formatApyBps(p.apy_bps)} APY</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Amount to put to work</p>
        <div className="flex items-center w-full">
          <div className="h-12 rounded-l-[10px] bg-secondary px-4 py-3 flex items-center gap-2 text-base font-medium text-secondary-foreground shrink-0 w-[120px]">
            {selectedToken?.token_symbol && (
              <span className="shrink-0 size-5 overflow-hidden rounded-full">
                {getTokenIcon(selectedToken.token_symbol, 20)}
              </span>
            )}
            <span className="flex-1 truncate">{selectedToken?.token_symbol ?? '-'}</span>
          </div>
          <Input
            className="h-12 rounded-l-none rounded-r-[10px] border-l-0 bg-background px-2.5 py-3 text-base shadow-none md:text-base"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            disabled={!selectedPool}
            onChange={e => {
              const next = e.target.value
              if (next === '') return onAmountChange('')
              const max = selectedToken?.token_decimals ?? 0
              const pattern = max > 0 ? new RegExp(`^\\d*\\.?\\d{0,${max}}$`) : /^\d*$/
              if (pattern.test(next)) onAmountChange(next)
            }}
          />
        </div>
        <div className="text-xs font-medium text-muted-foreground flex gap-2 items-center justify-between px-0.5">
          <span>{fiat != null ? `≈ ${formatFiat(fiat)}` : ''}</span>
          {renderBalance()}
        </div>
        <div className="flex items-stretch w-full">
          {PERCENTS.map((pct, i) => (
            <Fragment key={pct}>
              {i > 0 && <div className="w-px bg-muted self-stretch shrink-0" />}
              <button
                type="button"
                disabled={percentDisabled}
                onClick={() => handlePercent(pct)}
                className={cn(
                  'flex-1 min-w-px h-7 flex items-center justify-center bg-secondary text-secondary-foreground text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  i === 0 && 'rounded-l-[10px]',
                  i === PERCENTS.length - 1 && 'rounded-r-[10px]',
                )}
              >
                {percentLabel(pct)}
              </button>
            </Fragment>
          ))}
        </div>
      </div>

      <p className="text-xs font-medium text-muted-foreground">
        Yield withdraws to your allowance, not your external wallet. Use Withdraw to send funds on-chain.
      </p>

      <Button size="lg" className="w-full h-12 text-base" disabled={!canReview} onClick={onReview}>
        Review Activation
      </Button>
    </StepCard>
  )
}
