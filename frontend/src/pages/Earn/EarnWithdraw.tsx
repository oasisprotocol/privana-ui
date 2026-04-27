import { useState } from 'react'
import { useParams } from 'react-router'
import { StepsNav } from '@/components/StepsNav'
import { WithdrawConfigureStep } from './WithdrawConfigureStep'

const steps = ['1. Configure', '2. Review']

export const EarnWithdraw = () => {
  const { poolId } = useParams<{ poolId: string }>()
  const [amount, setAmount] = useState('')
  const [step] = useState(0)

  if (!poolId) return null

  return (
    <div>
      <StepsNav steps={steps} activeIndex={step} ariaLabel="Withdraw progress" />

      <WithdrawConfigureStep
        poolId={poolId}
        amount={amount}
        onAmountChange={setAmount}
        onReview={() => {
          // TODO: advance to review step
        }}
      />
    </div>
  )
}
