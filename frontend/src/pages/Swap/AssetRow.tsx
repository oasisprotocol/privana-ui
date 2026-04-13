import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { TokenInfo } from '@/api/swap'
import { formatAmount } from '@/lib/tokens'

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
  balance?: { wei: string; loading: boolean }
  amountError?: string | null
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
  balance,
  amountError,
}: AssetRowProps) => {
  const renderBalance = () => {
    if (!token || !balance) return '-'
    if (balance.loading) return <Skeleton className="h-4 w-24" />
    if (token.token_decimals == null) return '-'
    return `${formatAmount(BigInt(balance.wei || '0'), token.token_decimals)} ${tokenLabel(token)}`
  }

  return (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col gap-2">
        <Label>Asset</Label>
        <Select
          value={token?.token_id ?? NONE}
          onValueChange={value => onTokenChange(value === NONE ? '' : value)}
        >
          <SelectTrigger size="sm" className="w-28">
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
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Label>Amount</Label>
        <div className="relative">
          <Input
            className={`h-8 ${loading ? 'opacity-50' : ''}`}
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            readOnly={readOnly}
            onChange={e => onAmountChange?.(e.target.value)}
          />
          {loading && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <div className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex gap-2">Available: {renderBalance()}</div>
        {amountError && <p className="text-xs text-destructive">{amountError}</p>}
      </div>
    </div>
  )
}
