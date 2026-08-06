import { Progress } from '@/components/ui/progress'
import type { SwapActivity } from '@/contexts/ActivityProvider/context'
import { activityRowSubtitle } from './labels'
import { resolveActivityVisual, TONE_TEXT } from './activityVisuals'
import { ActivityAmount, ActivityCard, ActivityIcon, ActivityRowBody } from './ActivityCardParts'

type SwapActivityCardProps = {
  activity: SwapActivity
  timestamp?: number
  divider?: boolean
}

export const SwapActivityCard = ({ activity, timestamp, divider }: SwapActivityCardProps) => {
  const { status, fromToken, toToken, fromAmount, toAmount } = activity
  const { Icon, iconClass } = resolveActivityVisual({ kind: 'swap', status })

  return (
    <ActivityCard divider={divider} icon={<ActivityIcon Icon={Icon} iconClass={iconClass} />}>
      <ActivityRowBody
        title="Swap"
        timestamp={timestamp}
        subtitle={activityRowSubtitle({ kind: 'swap', status })}
        amount={
          <div className="flex flex-col items-end">
            <ActivityAmount sign="−" className={TONE_TEXT.amber} token={fromToken} amount={fromAmount} />
            <ActivityAmount sign="+" className={TONE_TEXT.green} token={toToken} amount={toAmount} />
          </div>
        }
      />
      {status === 'in-progress' && <Progress />}
    </ActivityCard>
  )
}
