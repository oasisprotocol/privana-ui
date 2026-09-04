import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { TokenInfo } from '@/api/swap'
import { formatAmount, formatFiat } from '@/lib/tokens'
import { TokenSelectDialog } from './TokenSelectDialog'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { cn } from '@/lib/utils'

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
    if (!token || !balance) return null
    if (balance.loading) return <Skeleton className="h-4 w-32" />
    if (token.token_decimals == null) return <span>Balance: -</span>
    return (
      <span>{`Balance: ${formatAmount(BigInt(balance.wei || '0'), token.token_decimals)} ${tokenLabel(token)}`}</span>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 w-full h-[58px] rounded-full border border-input bg-white dark:bg-card pl-2 pr-1">
        <TokenSelectDialog
          tokens={tokens}
          value={token?.token_id}
          onValueChange={onTokenChange}
          disabledId={disabledId}
          disabled={disabled}
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="h-[42px] rounded-full px-3 gap-2 text-sm font-semibold shrink-0 [&_svg:not([class*='size-'])]:size-6"
            >
              {token?.token_symbol && (
                <span className="shrink-0 size-6 overflow-hidden rounded-full">
                  {getTokenIcon(token.token_symbol, 24)}
                </span>
              )}
              <span className="truncate text-left">{token ? tokenLabel(token) : 'Select'}</span>
              <ChevronDown className="size-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <div className="relative flex-1 min-w-0">
          <Input
            className={cn(
              'h-[58px] w-full rounded-r-full border-0 bg-transparent dark:bg-transparent px-3 text-right text-xl font-semibold text-foreground shadow-none focus-visible:ring-0 md:text-xl',
              loading && 'opacity-50',
              loading && !amount && 'pr-10',
            )}
            type="text"
            inputMode="decimal"
            placeholder={loading ? '' : '0'}
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
          {loading && !amount && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <div className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          )}
        </div>
      </div>
      <div className="min-h-6 text-xs font-medium text-muted-foreground flex gap-2 items-center justify-between px-0.5">
        <span>{fiatValue != null ? `≈ ${formatFiat(fiatValue)}` : ''}</span>
        <div className="flex items-center gap-2">
          {balanceLabel ? <span>{balanceLabel}</span> : renderBalance()}
          {onMax && token && balance && !balance.loading && balance.wei != null && (
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={onMax}
              disabled={disabled}
              className="h-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide dark:bg-[#2d3139] dark:text-foreground dark:hover:bg-[#2d3139]/80"
            >
              Max
            </Button>
          )}
        </div>
      </div>
      {amountError && <p className="text-xs text-destructive">{amountError}</p>}
    </div>
  )
}
