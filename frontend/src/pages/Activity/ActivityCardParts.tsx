import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/tokens'
import type { ActivityTokenInfo } from '@/contexts/ActivityProvider/context'
import { formatActivityTime } from './formatTime'
import { CounterpartyBadge } from './CounterpartyBadge'

export const ActivityIcon = ({ Icon, iconClass }: { Icon: LucideIcon; iconClass: string }) => (
  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconClass)}>
    <Icon className="h-4 w-4" />
  </span>
)

export const ActivityCard = ({
  children,
  divider,
  icon,
}: {
  children: ReactNode
  divider?: boolean
  icon?: ReactNode
}) => (
  <div className={cn('flex items-start gap-3 p-4', divider && 'border-t border-border')}>
    {icon}
    <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
  </div>
)

export const ActivityRowBody = ({
  title,
  timestamp,
  counterparty,
  subtitle,
  amount,
}: {
  title: string
  timestamp?: number
  counterparty?: string | null
  subtitle?: ReactNode
  amount?: ReactNode
}) => (
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold leading-tight text-foreground">{title}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {timestamp != null && <span>{formatActivityTime(timestamp)}</span>}
        <CounterpartyBadge counterparty={counterparty} />
      </div>
      {subtitle != null && <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>}
    </div>
    {amount != null && <div className="shrink-0 pl-2 text-right">{amount}</div>}
  </div>
)

export const ActivityAmount = ({
  sign,
  className,
  token,
  amount,
}: {
  sign: string
  className?: string
  token: ActivityTokenInfo
  amount: string
}) => (
  <div className={cn('whitespace-nowrap text-sm font-semibold tabular-nums', className)}>
    {sign}
    {formatAmount(BigInt(amount), token.decimals)} {token.symbol}
  </div>
)
