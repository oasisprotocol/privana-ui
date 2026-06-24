import { Progress } from '@/components/ui/progress'
import type { EarnActivity } from '@/contexts/ActivityProvider/context'
import type { DisplayKind } from './historyMapping'
import { ACTIVITY_TITLES } from './labels'
import { ActivityAmountRow, ActivityCard, ActivityCardHeader } from './ActivityCardParts'

type EarnActivityCardProps = {
  activity: EarnActivity
  timestamp?: number
}

export const EarnActivityCard = ({ activity, timestamp }: EarnActivityCardProps) => {
  const { status, direction, token, amount } = activity
  const kind: DisplayKind = direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw'

  return (
    <ActivityCard>
      <ActivityCardHeader title={ACTIVITY_TITLES[kind]} status={status} timestamp={timestamp} />

      <ActivityAmountRow kind={kind} token={token} amount={amount} />

      {status === 'in-progress' && <Progress />}
    </ActivityCard>
  )
}
