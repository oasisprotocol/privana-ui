import { ArrowRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { SwapActivity } from '@/contexts/ActivityProvider/context'
import { resolveActivityVisual } from './activityVisuals'
import { ActivityCard, ActivityCardHeader, ActivityIcon, TokenAmount } from './ActivityCardParts'

type SwapActivityCardProps = {
  activity: SwapActivity
  timestamp?: number
  divider?: boolean
}

export const SwapActivityCard = ({ activity, timestamp, divider }: SwapActivityCardProps) => {
  const { status, fromToken, toToken, fromAmount, toAmount } = activity
  const { Icon, toneClass } = resolveActivityVisual({ kind: 'swap', status })

  return (
    <ActivityCard divider={divider} icon={<ActivityIcon Icon={Icon} toneClass={toneClass} />}>
      <ActivityCardHeader title="Swap" status={status} timestamp={timestamp} />

      <div className="flex gap-4 items-center justify-center">
        <TokenAmount token={fromToken} amount={fromAmount} align="left" />
        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <ArrowRight className="size-4" />
        </div>
        <TokenAmount token={toToken} amount={toAmount} align="right" />
      </div>

      {status === 'in-progress' && <Progress />}
    </ActivityCard>
  )
}
