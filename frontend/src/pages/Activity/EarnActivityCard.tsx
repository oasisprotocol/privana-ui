import { Progress } from '@/components/ui/progress'
import { venueForStrategy } from '@/config/protocols'
import type { EarnActivity } from '@/contexts/ActivityProvider/context'
import type { DisplayKind } from './historyMapping'
import { ACTIVITY_TITLES, activityRowSubtitle } from './labels'
import { resolveActivityVisual, TONE_SIGN, TONE_TEXT } from './activityVisuals'
import { ActivityAmount, ActivityCard, ActivityIcon, ActivityRowBody } from './ActivityCardParts'
import { earnStageSteps, earnStageSummary } from './earnStages'
import { EarnStageList } from './EarnStageList'

type EarnActivityCardProps = {
  activity: EarnActivity
  timestamp?: number
  divider?: boolean
}

export const EarnActivityCard = ({ activity, timestamp, divider }: EarnActivityCardProps) => {
  const { status, direction, token, amount, error } = activity
  const kind: DisplayKind = direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw'
  const { Icon, tone, iconClass } = resolveActivityVisual({ kind, status })
  const inProgress = status === 'in-progress'
  const stages = activity.stages ?? []
  const summary = inProgress ? earnStageSummary(direction, activity.protocol, stages) : null

  return (
    <ActivityCard divider={divider} icon={<ActivityIcon Icon={Icon} iconClass={iconClass} />}>
      <ActivityRowBody
        title={ACTIVITY_TITLES[kind]}
        timestamp={timestamp}
        venue={venueForStrategy(activity.protocol)}
        subtitle={summary?.label ?? activityRowSubtitle({ kind, status })}
        failure={status === 'failed' ? error : undefined}
        amount={
          <ActivityAmount sign={TONE_SIGN[tone]} className={TONE_TEXT[tone]} token={token} amount={amount} />
        }
      />
      {inProgress && <Progress value={summary?.percent} />}
      {inProgress && stages.length > 0 && (
        <EarnStageList steps={earnStageSteps(direction, activity.protocol, stages)} />
      )}
    </ActivityCard>
  )
}
