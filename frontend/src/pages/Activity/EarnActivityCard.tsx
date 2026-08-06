import { Progress } from '@/components/ui/progress'
import type { EarnActivity } from '@/contexts/ActivityProvider/context'
import type { DisplayKind } from './historyMapping'
import { ACTIVITY_TITLES, activityRowSubtitle } from './labels'
import { resolveActivityVisual, TONE_SIGN, TONE_TEXT } from './activityVisuals'
import { ActivityAmount, ActivityCard, ActivityIcon, ActivityRowBody } from './ActivityCardParts'

type EarnActivityCardProps = {
  activity: EarnActivity
  timestamp?: number
  divider?: boolean
}

export const EarnActivityCard = ({ activity, timestamp, divider }: EarnActivityCardProps) => {
  const { status, direction, token, amount } = activity
  const kind: DisplayKind = direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw'
  const { Icon, tone, iconClass } = resolveActivityVisual({ kind, status })

  return (
    <ActivityCard divider={divider} icon={<ActivityIcon Icon={Icon} iconClass={iconClass} />}>
      <ActivityRowBody
        title={ACTIVITY_TITLES[kind]}
        timestamp={timestamp}
        subtitle={activityRowSubtitle({ kind, status })}
        amount={<ActivityAmount sign={TONE_SIGN[tone]} className={TONE_TEXT[tone]} token={token} amount={amount} />}
      />
      {status === 'in-progress' && <Progress />}
    </ActivityCard>
  )
}
