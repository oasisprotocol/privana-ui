import type { ReactNode } from 'react'
import { Info, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AUTO_SLIPPAGE_PERCENT, parseSlippage, slippageNote } from './slippage'

const SWAP_DEADLINE_MINUTES = 30

const SettingLabel = ({ children, info }: { children: ReactNode; info: string }) => (
  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
    {children}
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="size-3.5 text-muted-foreground cursor-help" aria-label={info} />
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{info}</TooltipContent>
    </Tooltip>
  </span>
)

type SwapSettingsProps = {
  slippage: string
  onSlippageChange: (value: string) => void
}

export const SwapSettings = ({ slippage, onSlippageChange }: SwapSettingsProps) => {
  const custom = parseSlippage(slippage)
  const note = slippageNote(slippage)

  return (
    <Popover
      onOpenChange={open => {
        if (!open && slippage && custom == null) onSlippageChange('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Swap settings"
          className={cn(
            '[&_svg]:size-5',
            custom == null
              ? 'text-muted-foreground'
              : 'bg-primary/25 text-foreground hover:bg-primary/35 dark:hover:bg-primary/35',
          )}
        >
          {custom != null && <span className="text-sm font-semibold">{custom}%</span>}
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-80 flex-col gap-4 rounded-xl">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <SettingLabel info="Your swap is priced again when it runs. If it would pay out more than this below the quote, it doesn't go through and no funds move.">
              Max slippage
            </SettingLabel>
            <div className="flex h-9 items-center gap-1 rounded-full border border-input pl-1 pr-3">
              <button
                type="button"
                onClick={() => onSlippageChange('')}
                className={cn(
                  'rounded-full px-2 py-1 text-xs font-semibold',
                  slippage ? 'text-muted-foreground hover:text-foreground' : 'bg-primary/25 text-foreground',
                )}
              >
                Auto
              </button>
              <input
                aria-label="Max slippage in percent"
                inputMode="decimal"
                placeholder={AUTO_SLIPPAGE_PERCENT.toFixed(2)}
                value={slippage}
                onChange={e => {
                  const next = e.target.value.replace(',', '.')
                  if (/^\d{0,2}(\.\d{0,2})?$/.test(next)) onSlippageChange(next)
                }}
                className="w-12 bg-transparent text-right text-sm outline-none placeholder:text-muted-foreground"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          {note && (
            <p
              className={cn(
                'text-xs',
                note.kind === 'error' ? 'text-destructive' : 'text-amber-600 dark:text-amber-400',
              )}
            >
              {note.text}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <SettingLabel info="How long a quote can be confirmed after it is made.">
            Swap deadline
          </SettingLabel>
          <span className="text-sm text-muted-foreground">{SWAP_DEADLINE_MINUTES} minutes</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
