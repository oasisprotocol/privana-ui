import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { TokenInfo } from '@/api/swap'
import { formatFiat } from '@/lib/tokens'
import { TokenAmount } from '@/components/TokenAmount'
import { TokenSelectDialog } from './TokenSelectDialog'
import { getTokenIcon, normalizeAmountInput } from '@oasisprotocol/privana-sdk'
import { cn } from '@/lib/utils'

const tokenLabel = (token: TokenInfo) => token.token_symbol ?? token.token_type_name

type AssetRowProps = {
  tokens: TokenInfo[]
  token: TokenInfo | undefined
  disabledId?: string
  onTokenChange: (id: string) => void
  amount: string
  onAmountChange?: (v: string) => void
  readOnly?: boolean
  loading?: boolean
  refreshing?: boolean
  disabled?: boolean
  balance?: { wei: string; loading: boolean }
  amountError?: string | null
  fiatValue?: number
  balanceLabel?: string
  balanceTitle?: string
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
  refreshing,
  disabled,
  balance,
  amountError,
  fiatValue,
  balanceLabel,
  balanceTitle = 'Balance',
  onMax,
}: AssetRowProps) => {
  const renderBalance = () => {
    if (!token || !balance) return null
    if (balance.loading) return <Skeleton className="h-4 w-32" />
    if (token.token_decimals == null) return <span>{balanceTitle}: -</span>
    return (
      <span>
        {balanceTitle}:{' '}
        <TokenAmount
          amount={balance.wei || '0'}
          token={{ symbol: token.token_symbol ?? '', decimals: token.token_decimals }}
        />{' '}
        {tokenLabel(token)}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 w-full h-[60px] rounded-full border border-input bg-white dark:bg-card px-4 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
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
              className="inline-flex shrink-0 items-center gap-2 rounded-full text-xl font-semibold leading-none outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
            >
              {token?.token_symbol && (
                <span className="shrink-0 size-7 overflow-hidden rounded-full">
                  {getTokenIcon(token.token_symbol, 28)}
                </span>
              )}
              <span className="flex flex-col items-start leading-none">
                <span>{token ? tokenLabel(token) : 'Select'}</span>
                {token?.chain_name && (
                  <span className="mt-0.5 text-[0.7rem] font-medium text-muted-foreground">
                    {token.chain_name}
                  </span>
                )}
              </span>
              <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
            </button>
          }
        />
        <div className="relative flex-1 min-w-0">
          <Input
            className={cn(
              'h-full w-full border-0 bg-transparent dark:bg-transparent px-0 text-right text-[1.6rem] font-semibold leading-none tabular-nums text-foreground shadow-none focus-visible:ring-0 md:text-[1.6rem]',
              amountError && 'text-destructive',
              refreshing ? 'motion-safe:animate-pulse motion-reduce:opacity-50' : loading && 'opacity-50',
              loading && !amount && 'pr-8',
            )}
            type="text"
            inputMode="decimal"
            placeholder={loading ? '' : '0.00'}
            value={amount}
            readOnly={readOnly}
            disabled={disabled}
            onChange={e => {
              // Pasted "1,234.50" and a decimal comma both become one plain number.
              const next = normalizeAmountInput(e.target.value)
              if (next != null) onAmountChange?.(next)
            }}
          />
          {loading && !amount && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <div className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          )}
        </div>
      </div>
      <div className="min-h-6 text-sm text-muted-foreground flex gap-2 items-center justify-between px-0.5">
        <span>
          {fiatValue != null && (
            <span className="inline-block animate-fade-in">{`≈ ${formatFiat(fiatValue)}`}</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {balanceLabel ? <span>{balanceLabel}</span> : renderBalance()}
          {onMax && token && balance && !balance.loading && balance.wei != null && (
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={onMax}
              disabled={disabled}
              className="h-auto rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide dark:bg-[#2d3139] dark:text-foreground dark:hover:bg-[#2d3139]/80"
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
