import { useState } from 'react'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { getTokenIcon } from '@oasisprotocol/flexvaults-sdk'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type RowProps = { label: string; value: string }
const Row = ({ label, value }: RowProps) => (
  <div className="flex items-center justify-between text-xs font-medium leading-4">
    <p className="text-muted-foreground">{label}</p>
    <p className="text-foreground">{value}</p>
  </div>
)

export type SwapStatus = 'in-progress' | 'completed' | 'failed'

const StatusBadge = ({ status }: { status: SwapStatus }) => {
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

type SwapActivityCardProps = {
  status: SwapStatus
}

export const SwapActivityCard = ({ status }: SwapActivityCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4 bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground leading-7">Swap</p>
        <StatusBadge status={status} />
      </div>

      <div className="flex gap-4 items-center justify-center">
        <div className="flex-1 flex flex-col gap-1 min-w-0 overflow-hidden">
          <p className="text-xs font-medium text-muted-foreground leading-4">You pay</p>
          <div className="flex gap-1 items-center">
            <span className="text-xl font-semibold text-foreground leading-none">100.00</span>
            <span className="shrink-0 size-4 overflow-hidden rounded-full">{getTokenIcon('USDC', 16)}</span>
            <span className="text-sm font-semibold text-foreground leading-none">USDC</span>
          </div>
        </div>
        <div className="bg-secondary p-3 rounded-md flex items-center justify-center shrink-0">
          <ArrowRight className="size-4" />
        </div>
        <div className="flex-1 flex flex-col gap-1 items-end min-w-0 overflow-hidden">
          <p className="text-xs font-medium text-muted-foreground leading-4">You receive</p>
          <div className="flex gap-1 items-center justify-end">
            <span className="text-xl font-semibold text-foreground leading-none">0.03459</span>
            <span className="shrink-0 size-4 overflow-hidden rounded-full">{getTokenIcon('ETH', 16)}</span>
            <span className="text-sm font-semibold text-foreground leading-none">ETH</span>
          </div>
        </div>
      </div>

      {status === 'in-progress' && (
        <div className="h-1 w-full rounded-full bg-primary/20 overflow-hidden">
          <div className="h-full w-3/4 bg-primary rounded-full" />
        </div>
      )}

      <Separator />

      {detailsOpen && (
        <div className="flex flex-col gap-4">
          <Row label="Rate" value="1 USDC = 0.000346 ETH" />
          <Row label="Privacy" value="🔒 No public trace" />
          <Row label="Fee" value="~$0.02" />
          <Row label="Estimated time" value="<2 seconds" />
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
