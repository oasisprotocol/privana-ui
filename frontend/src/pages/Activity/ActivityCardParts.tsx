import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/tokens'
import type { ActivityStatus, ActivityTokenInfo } from '@/contexts/ActivityProvider/context'

export const ActivityCard = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-3 bg-white dark:bg-card p-4 rounded-2xl shadow-[0_1px_2px_0_rgba(87,97,117,0.05),0_4px_10px_0_rgba(87,97,117,0.08)]">
    {children}
  </div>
)

type ActivityCardHeaderProps = {
  title: string
  status: ActivityStatus
}
export const ActivityCardHeader = ({ title, status }: ActivityCardHeaderProps) => (
  <div className="flex items-center justify-between gap-2">
    <p className="text-base font-semibold text-foreground leading-6 truncate">{title}</p>
    <StatusBadge status={status} />
  </div>
)

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
    <p className="text-sm font-normal text-muted-foreground leading-5">{label}</p>
    <div className={cn('flex gap-1 items-center', align === 'right' && 'justify-end')}>
      <span className="text-xl font-semibold text-foreground leading-none">
        {formatAmount(BigInt(amount), token.decimals)}
      </span>
      <span className="shrink-0 size-4 overflow-hidden rounded-full">{getTokenIcon(token.symbol, 16)}</span>
      <span className="text-sm font-semibold text-foreground leading-none">{token.symbol}</span>
    </div>
  </div>
)
