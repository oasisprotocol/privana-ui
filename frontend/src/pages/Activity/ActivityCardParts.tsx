import { Check } from 'lucide-react'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/tokens'
import type { ActivityStatus, ActivityTokenInfo } from '@/contexts/ActivityProvider/context'

export const StatusBadge = ({ status }: { status: ActivityStatus }) => {
  if (status === 'completed') {
    return (
      <Badge className="bg-chart-positive text-white">
        <Check />
        Completed
      </Badge>
    )
  }
  if (status === 'failed') {
    return <Badge variant="destructive">Failed</Badge>
  }
  return <Badge>In progress</Badge>
}

type TokenAmountProps = {
  label: string
  token: ActivityTokenInfo
  amount: string
  align?: 'left' | 'right'
}
export const TokenAmount = ({ label, token, amount, align = 'left' }: TokenAmountProps) => (
  <div className={cn('flex-1 flex flex-col gap-1 min-w-0 overflow-hidden', align === 'right' && 'items-end')}>
    <p className="text-xs font-medium text-muted-foreground leading-4">{label}</p>
    <div className={cn('flex gap-1 items-center', align === 'right' && 'justify-end')}>
      <span className="text-xl font-semibold text-foreground leading-none">
        {formatAmount(BigInt(amount), token.decimals)}
      </span>
      <span className="shrink-0 size-4 overflow-hidden rounded-full">{getTokenIcon(token.symbol, 16)}</span>
      <span className="text-sm font-semibold text-foreground leading-none">{token.symbol}</span>
    </div>
  </div>
)
