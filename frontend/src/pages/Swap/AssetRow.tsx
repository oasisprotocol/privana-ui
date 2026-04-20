import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { TokenInfo } from '@/api/swap'
import { formatAmount, formatFiat } from '@/lib/tokens'
import { TokenSelectDialog } from './TokenSelectDialog'
// TODO: uncomment when new SDK is published
// import { getTokenIcon } from '@oasisprotocol/flexvaults-sdk'

const tokenLabel = (token: TokenInfo) => token.token_symbol ?? token.token_type_name

type AssetRowProps = {
  tokens: TokenInfo[]
  token: TokenInfo | undefined
  disabledId: string
  onTokenChange: (id: string) => void
  amount: string
  onAmountChange?: (v: string) => void
  readOnly?: boolean
  loading?: boolean
  disabled?: boolean
  balance?: { wei: string; loading: boolean }
  amountError?: string | null
  fiatValue?: number
  balanceLabel?: string
  onMax?: () => void
}

export const AssetRow = ({
  tokens,
  token,
  disabledId,
  onTokenChange,
  amount,
  onAmountChange,
  readOnly,
  loading,
  disabled,
  balance,
  amountError,
  fiatValue,
  balanceLabel,
  onMax,
}: AssetRowProps) => {
  const renderBalance = () => {
    if (!token || !balance) return <span>Balance: -</span>
    if (balance.loading) return <Skeleton className="h-4 w-32" />
    if (token.token_decimals == null) return <span>Balance: -</span>
    return (
      <span>{`Balance: ${formatAmount(BigInt(balance.wei || '0'), token.token_decimals)} ${tokenLabel(token)}`}</span>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center w-full">
        <TokenSelectDialog
          tokens={tokens}
          value={token?.token_id}
          onValueChange={onTokenChange}
          disabledId={disabledId}
          disabled={disabled}
          trigger={
            <button
              type="button"
              disabled={disabled}
              className="h-12 rounded-l-[10px] rounded-r-none bg-secondary px-4 py-3 flex items-center gap-2 text-base font-medium text-secondary-foreground shrink-0 w-[120px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none"
            >
              {/* TODO: uncomment when new SDK is published
              {token?.token_symbol && (
                <span className="shrink-0 size-5 overflow-hidden rounded-full">
                  {getTokenIcon(token.token_symbol, 20)}
                </span>
              )}
              */}
              <span className="flex-1 truncate text-left">{token ? tokenLabel(token) : 'Select'}</span>
              <ChevronDown className="size-4 shrink-0 opacity-50" />
            </button>
          }
        />
        <div className="relative flex-1 min-w-0">
          <Input
            className={`h-12 rounded-l-none rounded-r-[10px] border-l-0 bg-background px-2.5 py-3 text-base shadow-none md:text-base ${loading ? 'opacity-50' : ''}`}
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            readOnly={readOnly}
            disabled={disabled}
            onChange={e => {
              const next = e.target.value
              if (next === '') return onAmountChange?.('')
              const max = token?.token_decimals ?? 0
              const pattern = max > 0 ? new RegExp(`^\\d*\\.?\\d{0,${max}}$`) : /^\d*$/
              if (pattern.test(next)) onAmountChange?.(next)
            }}
          />
          {loading && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <div className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          )}
        </div>
      </div>
      <div className="text-xs font-medium text-muted-foreground flex gap-2 items-center justify-between px-0.5">
        <span>{fiatValue != null ? `≈ ${formatFiat(fiatValue)}` : ''}</span>
        <div className="flex items-center gap-2">
          {balanceLabel ? <span>{balanceLabel}</span> : renderBalance()}
          {onMax && balance && !balance.loading && balance.wei != null && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-6"
              onClick={onMax}
              disabled={disabled || !token}
            >
              MAX
            </Button>
          )}
        </div>
      </div>
      {amountError && <p className="text-xs text-destructive">{amountError}</p>}
    </div>
  )
}
