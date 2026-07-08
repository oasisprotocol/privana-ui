import { ReactNode, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { TokenInfo } from '@/api/swap'
import { formatAmount } from '@/lib/tokens'
import { cn } from '@/lib/utils'
import { getTokenIcon, useBatchBalances } from '@oasisprotocol/privana-sdk'

const tokenLabel = (token: TokenInfo) => token.token_symbol ?? token.token_type_name

const CARD_ROW =
  'bg-white dark:bg-card ' +
  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_2px_0_rgba(87,97,117,0.05),0_4px_10px_0_rgba(87,97,117,0.08)] ' +
  'dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_1px_2px_0_rgba(0,0,0,0.4),0_4px_12px_0_rgba(0,0,0,0.5)]'

type TokenSelectDialogProps = {
  tokens: TokenInfo[]
  value?: string
  onValueChange: (id: string) => void
  disabledId?: string
  disabled?: boolean
  trigger: ReactNode
}

export const TokenSelectDialog = ({
  tokens,
  value,
  onValueChange,
  disabledId,
  disabled,
  trigger,
}: TokenSelectDialogProps) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [chainFilter, setChainFilter] = useState('All')

  const tokenIds = useMemo(() => tokens.map(t => t.token_id as `0x${string}`), [tokens])
  const { balances, isLoading: balancesLoading } = useBatchBalances({ tokenIds, enabled: open })
  const balanceMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of balances) map.set(b.token_id, b.balance)
    return map
  }, [balances])

  const chainFilters = useMemo(() => {
    const chains = tokens.map(t => t.chain_name).filter((c): c is string => !!c)
    return ['All', ...Array.from(new Set(chains))]
  }, [tokens])

  const q = query.trim().toLowerCase()
  const filtered = tokens.filter(t => {
    if (chainFilter !== 'All' && t.chain_name !== chainFilter) return false
    if (!q) return true
    return [t.token_symbol, t.token_type_name, t.token_name]
      .filter((v): v is string => !!v)
      .some(v => v.toLowerCase().includes(q))
  })

  const handleSelect = (id: string) => {
    onValueChange(id)
    setOpen(false)
    setQuery('')
    setChainFilter('All')
  }

  const renderBalance = (token: TokenInfo): ReactNode => {
    if (token.token_decimals == null) return null
    if (balancesLoading && !balanceMap.has(token.token_id)) {
      return <Skeleton className="ml-auto h-4 w-14" />
    }
    return (
      <div className="text-sm font-medium tabular-nums">
        {formatAmount(BigInt(balanceMap.get(token.token_id) ?? '0'), token.token_decimals)}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={next => (!disabled ? setOpen(next) : undefined)}>
      <DialogTrigger asChild disabled={disabled} className="dark:bg-transparent">
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md gap-4 rounded-[14px] p-6">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-2xl font-medium leading-8">Select a token</DialogTitle>
          <DialogDescription className="text-sm">Choose the asset you want to use</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-full border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-offset-1">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Enter token name"
            className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {chainFilters.length > 2 && (
          <div className="flex flex-wrap gap-2">
            {chainFilters.map(chain => {
              const active = chainFilter === chain
              return (
                <button
                  key={chain}
                  type="button"
                  onClick={() => setChainFilter(chain)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'border border-transparent bg-secondary text-secondary-foreground dark:bg-[#2d3139] dark:text-foreground'
                      : 'border border-input text-muted-foreground hover:text-foreground',
                  )}
                >
                  {chain}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assets</p>
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto pb-1">
            {filtered.map(token => {
              const isDisabled = token.token_id === disabledId
              const isSelected = value === token.token_id
              return (
                <li key={token.token_id}>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelect(token.token_id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-transform',
                      CARD_ROW,
                      isDisabled ? 'cursor-not-allowed opacity-50' : 'active:scale-[0.99]',
                    )}
                  >
                    {token.token_symbol && (
                      <span className="size-9 shrink-0 overflow-hidden rounded-full">
                        {getTokenIcon(token.token_symbol, 36)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-foreground">{tokenLabel(token)}</div>
                      {token.chain_name && (
                        <div className="truncate text-xs text-muted-foreground">on {token.chain_name}</div>
                      )}
                    </div>
                    <div className="ml-auto text-right">
                      {renderBalance(token)}
                      {isSelected && (
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-chart-positive">
                          Selected
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="rounded-2xl bg-muted/40 py-6 text-center text-sm text-muted-foreground">
                No tokens found
              </li>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
