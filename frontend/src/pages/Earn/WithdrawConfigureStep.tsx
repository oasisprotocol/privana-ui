import { useMemo } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useTokenPrices } from '@/api/coin-gecko'
import type { EarnBalance, EarnPool } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount, formatFiat, isPositiveAmount } from '@/lib/tokens'
import { PROTOCOL_LABELS } from './labels'

const PERCENTS = [25, 50, 75, 100] as const

type WithdrawConfigureStepProps = {
  pool: EarnPool | undefined
  position: EarnBalance | undefined
  token: TokenInfo | undefined
  isLoading: boolean
  amount: string
  onAmountChange: (v: string) => void
  onReview: () => void
}

export const WithdrawConfigureStep = ({
  pool,
  position,
  token,
  isLoading,
  amount,
  onAmountChange,
  onReview,
}: WithdrawConfigureStepProps) => {
  const decimals = token?.token_decimals
  const protocol = pool ? (PROTOCOL_LABELS[pool.strategy] ?? pool.strategy) : ''
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

  const handleInput = (next: string) => {
    if (next === '') return onAmountChange('')
    const max = decimals ?? 0
    const pattern = max > 0 ? new RegExp(`^\\d*\\.?\\d{0,${max}}$`) : /^\d*$/
    if (pattern.test(next)) onAmountChange(next)
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
      <div className="flex flex-col items-center gap-6 w-full max-w-110 mx-auto">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-6 h-14 w-40" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!pool || !position) {
    return <p className="text-center text-destructive">Position not found</p>
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-110 mx-auto">
      <h2 className="text-xl font-semibold text-foreground">Remove from {protocol}</h2>

      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-baseline justify-center gap-2">
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={e => handleInput(e.target.value)}
            size={Math.max(1, amount.length)}
            aria-label="Amount to remove"
            className="bg-transparent text-center text-5xl font-semibold tracking-tight tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
          />
          <span className="text-xl font-semibold text-muted-foreground">{tokenSymbol}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          In Earn:{' '}
          <span className="font-medium text-foreground">
            {positionLabel} {tokenSymbol}
          </span>
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

      <Button size="lg" className="mt-4 h-12 w-full text-base" disabled={!canReview} onClick={onReview}>
        Review
      </Button>
    </div>
  )
}
