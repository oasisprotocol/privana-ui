import { ReactNode, useState } from 'react'
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
import type { TokenInfo } from '@/api/swap'
import { cn } from '@/lib/utils'
// TODO: uncomment when new SDK is published
// import { getTokenIcon } from '@oasisprotocol/flexvaults-sdk'

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
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = !q
    ? tokens
    : tokens.filter(t =>
        [t.token_symbol, t.token_type_name, t.token_name]
          .filter((v): v is string => !!v)
          .some(v => v.toLowerCase().includes(q)),
      )

  const handleSelect = (id: string) => {
    onValueChange(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={next => (!disabled ? setOpen(next) : undefined)}>
      <DialogTrigger asChild disabled={disabled}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card gap-4 rounded-[14px] p-6">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-2xl font-medium leading-8">Select a token</DialogTitle>
          <DialogDescription className="text-sm">Choose asset you want to use</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Enter token name"
            className="h-10 pl-8 bg-background rounded-[10px]"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Assets</p>
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {filtered.map(token => {
              const isDisabled = token.token_id === disabledId
              const isSelected = value === token.token_id
              return (
                <button
                  key={token.token_id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelect(token.token_id)}
                  className={cn(
                    'flex gap-2 items-center px-4 py-3 bg-background border rounded-[10px] w-full text-left transition-colors',
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent cursor-pointer',
                    isSelected && 'border-primary',
                  )}
                >
                  {/* TODO: uncomment when new SDK is published
                  {token.token_symbol && (
                    <span className="shrink-0 size-5 overflow-hidden rounded-full">
                      {getTokenIcon(token.token_symbol, 20)}
                    </span>
                  )}
                  */}
                  <span className="text-base font-medium text-secondary-foreground">{tokenLabel(token)}</span>
                  {token.chain_name && (
                    <span className="text-xs font-medium text-muted-foreground flex-1 truncate">
                      on {token.chain_name}
                    </span>
                  )}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No tokens found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
