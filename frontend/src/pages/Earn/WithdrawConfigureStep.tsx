import { Fragment, useMemo } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { getTokenIcon } from '@oasisprotocol/flexvaults-sdk'
import { useTokenPrices } from '@/api/coin-gecko'
import { useEarnBalance, useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount, formatFiat, isPositiveAmount } from '@/lib/tokens'
import { cn } from '@/lib/utils'
import { STRATEGY_LABELS } from './labels'

const PERCENTS = [25, 50, 75, 100] as const
const percentLabel = (pct: number) => (pct === 100 ? 'Max' : `${pct}%`)

type WithdrawConfigureStepProps = {
  poolId: string
  amount: string
  onAmountChange: (v: string) => void
  onReview: () => void
}

export const WithdrawConfigureStep = ({
  poolId,
  amount,
  onAmountChange,
  onReview,
}: WithdrawConfigureStepProps) => {
  const { address } = useAccount()
  const { data: balanceData, isLoading: balanceLoading } = useEarnBalance(address)
  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading } = useTokens()

  const isLoading = balanceLoading || poolsLoading || tokensLoading

  const positions = balanceData?.positions ?? []
  const pools = poolsData?.pools ?? []

  const position = positions.find(p => p.pool_id === poolId)
  const pool = pools.find(p => p.pool_id === poolId)
  const token = pool ? tokensData?.tokens.find(t => t.token_id === pool.token_id) : undefined
  const decimals = token?.token_decimals
  const strategyName = pool ? (STRATEGY_LABELS[pool.strategy] ?? pool.strategy) : ''
  const tokenSymbol = token?.token_symbol ?? token?.token_type_name ?? ''

  const positionWei = useMemo(() => {
    if (!position?.underlying_amount) return 0n
    try {
      return BigInt(position.underlying_amount)
    } catch {
      return 0n
    }
  }, [position])
  const positionLabel = decimals != null ? formatAmount(positionWei, decimals) : '-'

  const priceTokenIds = useMemo(() => (token ? [token.token_id] : []), [token])
  const { data: prices } = useTokenPrices(priceTokenIds)
  const fiat = useMemo(() => {
    if (!prices || !amount || !token || token.token_decimals == null) return undefined
    const price = prices[token.token_id]
    if (price == null) return undefined
    try {
      const units = parseUnits(amount, token.token_decimals)
      const asNum = Number(formatUnits(units, token.token_decimals))
      return Number.isFinite(asNum) ? asNum * price : undefined
    } catch {
      return undefined
    }
  }, [prices, amount, token])

  const percentDisabled = !position || decimals == null || positionWei === 0n
  const handlePercent = (pct: number) => {
    if (percentDisabled || decimals == null) return
    const portion = pct === 100 ? positionWei : (positionWei * BigInt(pct)) / 100n
    onAmountChange(formatUnits(portion, decimals))
  }

  const exceedsBalance = useMemo(() => {
    if (!amount || decimals == null) return false
    try {
      return parseUnits(amount, decimals) > positionWei
    } catch {
      return false
    }
  }, [amount, decimals, positionWei])

  const canReview = !!position && isPositiveAmount(amount, decimals) && !exceedsBalance

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-120 mx-auto bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-full max-w-80" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!pool || !position) {
    return <p className="text-destructive">Position not found</p>
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-120 mx-auto bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-medium text-foreground leading-8">Withdraw from {strategyName}</h2>
        <p className="text-sm text-muted-foreground">Move yield earnings back to your allowance.</p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">Current {strategyName} balance</p>
        <div className="flex gap-1 items-center">
          <span className="text-xl font-semibold text-foreground leading-none">{positionLabel}</span>
          {tokenSymbol && (
            <span className="shrink-0 size-4 overflow-hidden rounded-full">
              {getTokenIcon(tokenSymbol, 16)}
            </span>
          )}
          <span className="text-sm font-semibold text-foreground leading-none">{tokenSymbol}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Amount to withdraw</p>
        <div className="flex items-center w-full">
          <div className="h-12 rounded-l-[10px] bg-secondary px-4 py-3 flex items-center gap-2 text-base font-medium text-secondary-foreground shrink-0 w-[120px]">
            {tokenSymbol && (
              <span className="shrink-0 size-5 overflow-hidden rounded-full">
                {getTokenIcon(tokenSymbol, 20)}
              </span>
            )}
            <span className="flex-1 truncate">{tokenSymbol || '-'}</span>
          </div>
          <Input
            className="h-12 rounded-l-none rounded-r-[10px] border-l-0 bg-background px-2.5 py-3 text-base shadow-none md:text-base"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={e => {
              const next = e.target.value
              if (next === '') return onAmountChange('')
              const max = decimals ?? 0
              const pattern = max > 0 ? new RegExp(`^\\d*\\.?\\d{0,${max}}$`) : /^\d*$/
              if (pattern.test(next)) onAmountChange(next)
            }}
          />
        </div>
        <div className="text-xs font-medium text-muted-foreground flex gap-2 items-center justify-between px-0.5">
          <span>{fiat != null ? `≈ ${formatFiat(fiat)}` : ''}</span>
          {exceedsBalance && <span className="text-destructive">Exceeds balance</span>}
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
        Funds move to your allowance — not to your external wallet.
      </p>

      <Button size="lg" className="w-full h-12 text-base" disabled={!canReview} onClick={onReview}>
        Review withdrawal
      </Button>
    </div>
  )
}
