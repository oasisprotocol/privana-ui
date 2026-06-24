import { ArrowRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { SwapActivity } from '@/contexts/ActivityProvider/context'
import { ActivityCard, ActivityCardHeader, TokenAmount } from './ActivityCardParts'

type SwapActivityCardProps = {
  activity: SwapActivity
  timestamp?: number
}

export const SwapActivityCard = ({ activity, timestamp }: SwapActivityCardProps) => {
  const { status, fromToken, toToken, fromAmount, toAmount } = activity

  return (
    <ActivityCard>
      <ActivityCardHeader title="Swap" status={status} timestamp={timestamp} />

      <div className="flex gap-4 items-center justify-center">
        <TokenAmount label="You pay" token={fromToken} amount={fromAmount} align="left" />
        <div className="bg-secondary p-3 rounded-md flex items-center justify-center shrink-0">
          <ArrowRight className="size-4" />
        </div>
        <TokenAmount label="You receive" token={toToken} amount={toAmount} align="right" />
      </div>

      {status === 'in-progress' && <Progress />}
    </ActivityCard>
  )
}
