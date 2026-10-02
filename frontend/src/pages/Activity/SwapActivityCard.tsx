import { Progress } from '@/components/ui/progress'
import type { SwapActivity } from '@/contexts/ActivityProvider/context'
import { activityRowSubtitle } from './labels'
import { activityIcon } from './activityVisuals'
import {
  ActivityAmount,
  ActivityCard,
  ActivityIcon,
  ActivityRowBody,
  SwapReceived,
} from './ActivityCardParts'

type SwapActivityCardProps = {
  activity: SwapActivity
  divider?: boolean
}

export const SwapActivityCard = ({ activity, divider }: SwapActivityCardProps) => {
  const { status, fromToken, toToken, fromAmount, toAmount, error } = activity

  return (
    <ActivityCard divider={divider}>
      <ActivityRowBody
        icon={<ActivityIcon Icon={activityIcon('swap')} status={status} />}
        title="Swap"
        subtitle={activityRowSubtitle({ kind: 'swap', status })}
        failure={status === 'failed' ? error : undefined}
        amount={<ActivityAmount token={fromToken} amount={fromAmount} />}
        aside={<SwapReceived token={toToken} amount={toAmount} />}
      />
      {status === 'in-progress' && <Progress className="mt-2" />}
    </ActivityCard>
  )
}
