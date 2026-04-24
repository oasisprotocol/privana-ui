import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { getTokenIcon } from '@oasisprotocol/flexvaults-sdk'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/tokens'
import type { ActivityStatus, EarnActivity } from '@/contexts/ActivityProvider/context'

type RowProps = { label: string; value: string }
const Row = ({ label, value }: RowProps) => (
  <div className="flex items-center justify-between text-xs font-medium leading-4">
    <p className="text-muted-foreground">{label}</p>
    <p className="text-foreground">{value}</p>
  </div>
)

const StatusBadge = ({ status }: { status: ActivityStatus }) => {
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

type EarnActivityCardProps = {
  activity: EarnActivity
}

export const EarnActivityCard = ({ activity }: EarnActivityCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { status, token, amount, protocol, apyLabel } = activity

  return (
    <div className="flex flex-col gap-4 bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground leading-7">Earn — Deposit</p>
        <StatusBadge status={status} />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground leading-4">Deposited</p>
        <div className="flex gap-1 items-center">
          <span className="text-xl font-semibold text-foreground leading-none">
            {formatAmount(BigInt(amount), token.decimals)}
          </span>
          <span className="shrink-0 size-4 overflow-hidden rounded-full">
            {getTokenIcon(token.symbol, 16)}
          </span>
          <span className="text-sm font-semibold text-foreground leading-none">{token.symbol}</span>
        </div>
      </div>

      {status === 'in-progress' && <Progress />}

      <Separator />

      {detailsOpen && (
        <div className="flex flex-col gap-4">
          <Row label="Protocol" value={protocol} />
          <Row label="APY" value={apyLabel ?? '—'} />
          <Row label="Privacy" value="🔒 No public trace" />
        </div>
      )}

      <div>
        <Button
          variant="secondary"
          size="xs"
          onClick={() => setDetailsOpen(open => !open)}
          aria-expanded={detailsOpen}
        >
          {detailsOpen ? 'Less details' : 'More details'}
          <ChevronDown className={cn('transition-transform', detailsOpen && 'rotate-180')} />
        </Button>
      </div>
    </div>
  )
}
