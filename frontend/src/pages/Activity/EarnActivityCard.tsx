import type { EarnActivity } from '@/contexts/ActivityProvider/context'
import type { DisplayKind } from './historyMapping'
import { moveCopy } from './labels'
import { activityIcon } from './activityVisuals'
import { ActivityAmount, ActivityCard, ActivityIcon, ActivityRowBody } from './ActivityCardParts'
import { earnStageSteps, earnStageSummary } from './earnStages'
import { EarnStageList } from './EarnStageList'
import { VenueBadge } from './VenueBadge'

type EarnActivityCardProps = {
  activity: EarnActivity
  divider?: boolean
}

export const EarnActivityCard = ({ activity, divider }: EarnActivityCardProps) => {
  const { status, direction, token, amount, error } = activity
  const kind: DisplayKind = direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw'
  const inProgress = status === 'in-progress'
  const stages = activity.stages ?? []
  const summary = inProgress ? earnStageSummary(direction, activity.protocol, stages) : null
  const { title, subtitle } = moveCopy(kind, status)

  return (
    <ActivityCard divider={divider}>
      <ActivityRowBody
        icon={<ActivityIcon Icon={activityIcon(kind)} status={status} />}
        title={title}
        subtitle={summary?.label ?? subtitle}
        failure={status === 'failed' ? error : undefined}
        amount={<ActivityAmount token={token} amount={amount} />}
        aside={<VenueBadge strategy={activity.protocol} />}
      />
      {inProgress && stages.length > 0 && (
        <EarnStageList steps={earnStageSteps(direction, activity.protocol, stages)} />
      )}
    </ActivityCard>
  )
}
