import { Progress } from '@/components/ui/progress'
import type { EarnActivity } from '@/contexts/ActivityProvider/context'
import type { DisplayKind } from './historyMapping'
import { ACTIVITY_AMOUNT_LABELS, ACTIVITY_TITLES } from './labels'
import { StatusBadge, TokenAmount } from './ActivityCardParts'

type EarnActivityCardProps = {
  activity: EarnActivity
}

export const EarnActivityCard = ({ activity }: EarnActivityCardProps) => {
  const { status, direction, token, amount } = activity
  const kind: DisplayKind = direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw'

  return (
    <div className="flex flex-col gap-4 bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground leading-7">{ACTIVITY_TITLES[kind]}</p>
        <StatusBadge status={status} />
      </div>

      <TokenAmount label={ACTIVITY_AMOUNT_LABELS[kind]} token={token} amount={amount} />

      {status === 'in-progress' && <Progress />}
    </div>
  )
}
