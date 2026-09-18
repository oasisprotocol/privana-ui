import { ReactNode, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { TokenInfo } from '@/api/swap'
import { TokenSelectList, useBatchBalances, type TokenSelectListItem } from '@oasisprotocol/privana-sdk'

const tokenLabel = (token: TokenInfo) => token.token_symbol ?? token.token_type_name

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

  const tokenIds = useMemo(() => tokens.map(t => t.token_id as `0x${string}`), [tokens])
  const { balances, isLoading: balancesLoading } = useBatchBalances({ tokenIds, enabled: open })

  const items = useMemo<TokenSelectListItem[]>(
    () =>
      tokens.map(t => ({
        id: t.token_id,
        symbol: tokenLabel(t),
        name: t.token_name ?? undefined,
        chainName: t.chain_name ?? undefined,
        decimals: t.token_decimals ?? 0,
      })),
    [tokens],
  )

  const balanceMap = useMemo<Record<string, string>>(
    () => Object.fromEntries(balances.map(b => [b.token_id, b.balance])),
    [balances],
  )

  const handleSelect = (id: string) => {
    onValueChange(id)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={next => (!disabled ? setOpen(next) : undefined)}>
      <DialogTrigger asChild disabled={disabled} className="dark:bg-transparent">
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md flex max-h-[calc(100dvh-2rem)] flex-col gap-4 rounded-[14px] p-6">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-2xl font-medium leading-8">Select a token</DialogTitle>
          <DialogDescription className="text-sm">Choose the asset you want to use</DialogDescription>
        </DialogHeader>
        <TokenSelectList
          items={items}
          balances={balanceMap}
          balancesLoading={balancesLoading}
          selectedId={value}
          disabledId={disabledId}
          onSelect={handleSelect}
          listClassName="min-h-0"
        />
      </DialogContent>
    </Dialog>
  )
}
