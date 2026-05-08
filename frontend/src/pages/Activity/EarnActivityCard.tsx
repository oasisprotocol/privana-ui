import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { EarnActivity } from '@/contexts/ActivityProvider/context'
import { Row } from '@/components/Row'
import { StatusBadge, TokenAmount } from './ActivityCardParts'

type EarnActivityCardProps = {
  activity: EarnActivity
}

export const EarnActivityCard = ({ activity }: EarnActivityCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { status, direction, token, amount, protocol, apyLabel } = activity
  const isDeposit = direction === 'deposit'

  return (
    <div className="flex flex-col gap-4 bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground leading-7">
          Earn — {isDeposit ? 'Deposit' : 'Withdraw'}
        </p>
        <StatusBadge status={status} />
      </div>

      <TokenAmount label={isDeposit ? 'Deposited' : 'Withdrew'} token={token} amount={amount} />

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
