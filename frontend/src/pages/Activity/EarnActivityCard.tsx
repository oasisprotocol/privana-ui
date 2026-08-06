import { Progress } from '@/components/ui/progress'
import type { EarnActivity } from '@/contexts/ActivityProvider/context'
import type { DisplayKind } from './historyMapping'
import { ACTIVITY_TITLES } from './labels'
import { resolveActivityVisual } from './activityVisuals'
import { ActivityAmountRow, ActivityCard, ActivityCardHeader, ActivityIcon } from './ActivityCardParts'

type EarnActivityCardProps = {
  activity: EarnActivity
  timestamp?: number
  divider?: boolean
}

export const EarnActivityCard = ({ activity, timestamp, divider }: EarnActivityCardProps) => {
  const { status, direction, token, amount } = activity
  const kind: DisplayKind = direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw'
  const { Icon, toneClass } = resolveActivityVisual({ kind, status })

  return (
    <ActivityCard divider={divider} icon={<ActivityIcon Icon={Icon} toneClass={toneClass} />}>
      <ActivityCardHeader title={ACTIVITY_TITLES[kind]} timestamp={timestamp} />

      <ActivityAmountRow kind={kind} token={token} amount={amount} />

      {status === 'in-progress' && <Progress />}
    </ActivityCard>
  )
}
