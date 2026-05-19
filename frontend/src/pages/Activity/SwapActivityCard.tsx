import { ArrowRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { SwapActivity } from '@/contexts/ActivityProvider/context'
import { StatusBadge, TokenAmount } from './ActivityCardParts'

type SwapActivityCardProps = {
  activity: SwapActivity
}

export const SwapActivityCard = ({ activity }: SwapActivityCardProps) => {
  const { status, fromToken, toToken, fromAmount, toAmount } = activity

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
    </div>
  )
}
