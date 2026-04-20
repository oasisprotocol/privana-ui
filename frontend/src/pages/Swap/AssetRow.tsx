import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { TokenInfo } from '@/api/swap'
import { formatAmount, formatFiat } from '@/lib/tokens'

// Shadcn Select does not support "no selection"
const NONE = '__none__'

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
}: AssetRowProps) => {
  const renderBalance = () => {
    if (!token || !balance) return '-'
    if (balance.loading) return <Skeleton className="h-4 w-24" />
    if (token.token_decimals == null) return '-'
    return `${formatAmount(BigInt(balance.wei || '0'), token.token_decimals)} ${tokenLabel(token)}`
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center w-full">
        <Select
          value={token?.token_id ?? NONE}
          onValueChange={value => onTokenChange(value === NONE ? '' : value)}
          disabled={disabled}
        >
          <SelectTrigger className="data-[size=default]:h-12 rounded-l-[10px] rounded-r-none border-transparent bg-secondary px-6 py-3 gap-2 text-base font-medium text-secondary-foreground shadow-none shrink-0 w-auto focus-visible:ring-0 focus-visible:border-transparent">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>—</SelectItem>
            {tokens.map(t => (
              <SelectItem key={t.token_id} value={t.token_id} disabled={t.token_id === disabledId}>
                {tokenLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      <div className="text-xs text-muted-foreground flex gap-2 items-center justify-between">
        <span>{fiatValue != null ? `≈ ${formatFiat(fiatValue)}` : ''}</span>
        <span>{balanceLabel ?? <>Available: {renderBalance()}</>}</span>
      </div>
      {amountError && <p className="text-xs text-destructive">{amountError}</p>}
    </div>
  )
}
