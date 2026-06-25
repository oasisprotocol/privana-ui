import { ArrowRight, Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { Badge } from '@/components/ui/badge'
import { SurfaceCard } from '@/components/SurfaceCard'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/tokens'
import type { ActivityStatus, ActivityTokenInfo } from '@/contexts/ActivityProvider/context'
import type { DisplayKind } from './historyMapping'
import { ACTIVITY_AMOUNT_LABELS } from './labels'
import { formatActivityTime } from './formatTime'

export const ActivityCard = ({ children }: { children: ReactNode }) => (
  <SurfaceCard className="flex flex-col gap-3 p-4">{children}</SurfaceCard>
)

type ActivityCardHeaderProps = {
  title: string
  status: ActivityStatus
  timestamp?: number
}
export const ActivityCardHeader = ({ title, status, timestamp }: ActivityCardHeaderProps) => (
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2 min-w-0">
      <p className="text-base font-semibold text-foreground leading-6 truncate">{title}</p>
      <StatusBadge status={status} />
    </div>
    {timestamp != null && (
      <span className="shrink-0 text-xs font-normal text-muted-foreground leading-4">
        {formatActivityTime(timestamp)}
      </span>
    )}
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

export const TokenValue = ({ token, amount }: { token: ActivityTokenInfo; amount: string }) => (
  <div className="flex gap-1 items-center shrink-0">
    <span className="text-sm md:text-base font-medium text-foreground leading-none">
      {formatAmount(BigInt(amount), token.decimals)}
    </span>
    <span className="shrink-0 size-4 overflow-hidden rounded-full">{getTokenIcon(token.symbol, 16)}</span>
    <span className="text-sm md:text-base font-medium text-muted-foreground leading-none">
      {token.symbol}
    </span>
  </div>
)

// "from → to" label with an inline arrow icon (matches the Swap card's arrow).
const DirectionLabel = ({ from, to }: { from: string; to: string }) => (
  <span className="inline-flex items-center gap-1">
    {from}
    <ArrowRight className="size-3.5 shrink-0" aria-hidden />
    {to}
  </span>
)

// Single source for the bottom-left description label. Earn moves render as a
// "Wallet → Earn" direction with an icon arrow; everything else is plain text.
const AmountLabel = ({ kind }: { kind: DisplayKind }) => {
  if (kind === 'earnDeposit') return <DirectionLabel from="Wallet" to="Earn" />
  if (kind === 'earnWithdraw') return <DirectionLabel from="Earn" to="Wallet" />
  return <>{ACTIVITY_AMOUNT_LABELS[kind]}</>
}

type ActivityAmountRowProps = {
  kind: DisplayKind
  token: ActivityTokenInfo
  amount: string
}
// Single-amount layout: description on the left, value pinned to the right.
export const ActivityAmountRow = ({ kind, token, amount }: ActivityAmountRowProps) => (
  <div className="flex items-center justify-between gap-2">
    <div className="text-sm font-normal text-muted-foreground leading-5 min-w-0 truncate">
      <AmountLabel kind={kind} />
    </div>
    <TokenValue token={token} amount={amount} />
  </div>
)

type TokenAmountProps = {
  label?: string
  token: ActivityTokenInfo
  amount: string
  align?: 'left' | 'right'
}
export const TokenAmount = ({ label, token, amount, align = 'left' }: TokenAmountProps) => (
  <div className={cn('flex-1 flex flex-col gap-1 min-w-0 overflow-hidden', align === 'right' && 'items-end')}>
    {label && <p className="text-sm font-normal text-muted-foreground leading-5">{label}</p>}
    <TokenValue token={token} amount={amount} />
  </div>
)
