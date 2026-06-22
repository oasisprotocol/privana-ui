import { Progress } from '@/components/ui/progress'
import type { EarnActivity } from '@/contexts/ActivityProvider/context'
import { StatusBadge, TokenAmount } from './ActivityCardParts'

type EarnActivityCardProps = {
  activity: EarnActivity
}

export const EarnActivityCard = ({ activity }: EarnActivityCardProps) => {
  const { status, direction, token, amount } = activity
  const isDeposit = direction === 'deposit'

  return (
    <div className="flex flex-col gap-4 bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground leading-7">
          {isDeposit ? 'Move to Earn' : 'Withdraw from Earn'}
        </p>
        <StatusBadge status={status} />
      </div>

      <TokenAmount label={isDeposit ? 'Deposited' : 'Withdrew'} token={token} amount={amount} />

      {status === 'in-progress' && <Progress />}
    </div>
  )
}
