import { Progress } from '@/components/ui/progress'
import type { EarnActivity } from '@/contexts/ActivityProvider/context'
import type { DisplayKind } from './historyMapping'
import { ACTIVITY_AMOUNT_LABELS, ACTIVITY_TITLES } from './labels'
import { ActivityCard, ActivityCardHeader, TokenAmount } from './ActivityCardParts'

type EarnActivityCardProps = {
  activity: EarnActivity
}

export const EarnActivityCard = ({ activity }: EarnActivityCardProps) => {
  const { status, direction, token, amount } = activity
  const kind: DisplayKind = direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw'

  return (
    <ActivityCard>
      <ActivityCardHeader title={ACTIVITY_TITLES[kind]} status={status} />

      <TokenAmount label={ACTIVITY_AMOUNT_LABELS[kind]} token={token} amount={amount} />

      {status === 'in-progress' && <Progress />}
    </ActivityCard>
  )
}
