import type { ReactNode } from 'react'
import { maxAmount, normalizeAmountInput } from '@oasisprotocol/privana-sdk'
import type { TokenInfo } from '@/api/swap'
import { amountInputError, exceedsAmount, formatFiat } from '@/lib/tokens'
import { useAmountFiat } from '@/hooks/useAmountFiat'

const DEFAULT_PERCENTS = [25, 50, 75, 100] as const

type EarnAmountFieldProps = {
  amount: string
  onAmountChange: (v: string) => void
  token: TokenInfo | undefined
  /** Base-units cap used for the % chips and the "Exceeds balance" check. */
  maxWei: bigint
  /** Line under the amount, e.g. "Available: 100 USDC" or "In Earn: …". */
  sublabel: ReactNode
  ariaLabel: string
  /** Disables the input and chips (e.g. before a venue is selected). */
  disabled?: boolean
  percents?: readonly number[]
}

// The shared "big centered amount" entry used by both the deposit and withdraw
// screens: auto-sizing input + symbol, fiat / exceeds helper, and % chips.
export const EarnAmountField = ({
  amount,
  onAmountChange,
  token,
  maxWei,
  sublabel,
  ariaLabel,
  disabled,
  percents = DEFAULT_PERCENTS,
}: EarnAmountFieldProps) => {
  const decimals = token?.token_decimals
  const tokenSymbol = token?.token_symbol ?? token?.token_type_name ?? ''
  const fiat = useAmountFiat(token, amount)
  const inputError = amountInputError(amount, decimals)
  const exceeds = exceedsAmount(amount, decimals, maxWei)

  const handleInput = (text: string) => {
    if (disabled) return
    // Pasted "1,234.50" and a decimal comma both become one plain number.
    const next = normalizeAmountInput(text)
    if (next != null) onAmountChange(next)
  }

  const percentDisabled = disabled || decimals == null || maxWei === 0n
  const handlePercent = (pct: number) => {
    if (percentDisabled || decimals == null) return
    const portion = pct === 100 ? maxWei : (maxWei * BigInt(pct)) / 100n
    onAmountChange(maxAmount(portion, { symbol: tokenSymbol, decimals }).input)
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-baseline justify-center gap-2">
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            disabled={disabled}
            onChange={e => handleInput(e.target.value)}
            size={Math.max(1, amount.length)}
            aria-label={ariaLabel}
            className="bg-transparent text-center text-5xl font-semibold tracking-tight tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
          />
          {tokenSymbol && <span className="text-xl font-semibold text-muted-foreground">{tokenSymbol}</span>}
        </div>
        <p className="text-sm text-muted-foreground">{sublabel}</p>
        <div className="h-4 text-xs">
          {inputError ? (
            <span className="text-destructive">{inputError}</span>
          ) : exceeds ? (
            <span className="text-destructive">Exceeds balance</span>
          ) : fiat != null ? (
            <span className="text-muted-foreground">≈ {formatFiat(fiat)}</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {percents.map(pct => (
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
    </div>
  )
}
