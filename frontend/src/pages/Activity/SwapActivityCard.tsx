import { useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatFiat } from '@/lib/tokens'
import type { SwapActivity } from '@/contexts/ActivityProvider/context'
import { Row } from '@/components/Row'
import { StatusBadge, TokenAmount } from './ActivityCardParts'

type SwapActivityCardProps = {
  activity: SwapActivity
}

export const SwapActivityCard = ({ activity }: SwapActivityCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { status, fromToken, toToken, fromAmount, toAmount, rateLabel, feeFiat } = activity

  return (
    <div className="flex flex-col gap-4 bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground leading-7">Swap</p>
        <StatusBadge status={status} />
      </div>

      <div className="flex gap-4 items-center justify-center">
        <TokenAmount label="You pay" token={fromToken} amount={fromAmount} align="left" />
        <div className="bg-secondary p-3 rounded-md flex items-center justify-center shrink-0">
          <ArrowRight className="size-4" />
        </div>
        <TokenAmount label="You receive" token={toToken} amount={toAmount} align="right" />
      </div>

      {status === 'in-progress' && <Progress />}

      <Separator />

      {detailsOpen && (
        <div className="flex flex-col gap-4">
          <Row label="Rate" value={rateLabel || '—'} />
          <Row label="Privacy" value="🔒 No public trace" />
          <Row label="Fee" value={feeFiat != null ? `~${formatFiat(feeFiat)}` : '—'} />
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
