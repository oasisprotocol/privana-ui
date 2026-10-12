import type { ReactNode } from 'react'
import { Check, type LucideIcon } from 'lucide-react'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { CopyButton } from '@/components/CopyButton'
import { Badge } from '@/components/ui/badge'
import { Row } from '@/components/Row'
import { SurfaceCard } from '@/components/SurfaceCard'
import { TokenAmount } from '@/components/TokenAmount'
import type { ActivityStatus, ActivityTokenInfo } from '@/contexts/ActivityProvider/context'
import { trimLongString } from '@/utils/trimLongString'

const STATUS_BADGE: Record<ActivityStatus, { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'bg-chart-positive/15 text-chart-positive' },
  'in-progress': { label: 'In progress', className: 'bg-primary/25 text-foreground' },
  failed: { label: 'Failed', className: 'bg-destructive/15 text-destructive' },
}

export const StatusBadge = ({ status }: { status: ActivityStatus }) => {
  const { label, className } = STATUS_BADGE[status]
  return (
    <Badge className={className}>
      {status === 'completed' && <Check strokeWidth={3} />}
      {label}
    </Badge>
  )
}

export const HeroAmount = ({
  amount,
  token,
  estimate,
}: {
  amount: string
  token: ActivityTokenInfo
  estimate?: boolean
}) => (
  <p className="mt-4 text-4xl font-semibold tracking-tight tabular-nums">
    {estimate && '≈ '}
    <TokenAmount amount={amount} token={token} />{' '}
    <span className="text-2xl font-normal text-muted-foreground">{token.symbol}</span>
  </p>
)

export const DetailsHero = ({
  Icon,
  status,
  amount,
  statusLine,
}: {
  Icon: LucideIcon
  status: ActivityStatus
  amount: ReactNode
  statusLine?: string
}) => (
  <div className="mt-4 flex flex-col items-center text-center">
    {status === 'in-progress' ? (
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-[3px] border-secondary border-t-foreground motion-safe:animate-spin" />
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground">
          <Icon className="h-5 w-5" />
        </span>
      </span>
    ) : (
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground">
        <Icon className="h-7 w-7" />
      </span>
    )}
    {amount}
    <div className="mt-3">
      <StatusBadge status={status} />
    </div>
    {statusLine && <p className="mt-2 text-xs text-muted-foreground">{statusLine}</p>}
  </div>
)

export const DetailsCard = ({ children }: { children: ReactNode }) => (
  <SurfaceCard className="mt-8 flex flex-col p-0">{children}</SurfaceCard>
)

export const DetailsRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <Row
    size="md"
    className="gap-4 px-4 py-3 border-b border-border last:border-b-0"
    label={label}
    value={children}
  />
)

export const AmountValue = ({
  amount,
  token,
  chain,
  estimate,
}: {
  amount: string
  token: ActivityTokenInfo
  chain?: string
  estimate?: boolean
}) => (
  <span className="inline-flex items-center justify-end gap-1.5 text-right">
    <span className="inline-flex size-4 shrink-0 overflow-hidden rounded-full">
      {getTokenIcon(token.symbol, 16)}
    </span>
    <span>
      {estimate && '≈ '}
      <TokenAmount amount={amount} token={token} withSymbol />
      {chain && <span className="text-muted-foreground"> · {chain}</span>}
    </span>
  </span>
)

export const IdValue = ({ value, copyLabel }: { value: string; copyLabel: string }) => (
  <span className="flex items-center gap-1">
    <span title={value} className="tabular-nums">
      {trimLongString(value)}
    </span>
    <CopyButton value={value} label={copyLabel} />
  </span>
)

export const ErrorBox = ({ message, reason }: { message: string; reason?: string }) => (
  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
    <p className="whitespace-pre-wrap break-words">{message}</p>
    {reason && <p className="mt-2 text-xs text-muted-foreground">Reason: {reason}</p>}
  </div>
)
