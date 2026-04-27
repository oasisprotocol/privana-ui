import { useState } from 'react'
import { useParams } from 'react-router'
import { StepsNav } from '@/components/StepsNav'
import { WithdrawConfigureStep } from './WithdrawConfigureStep'
import { WithdrawReviewStep } from './WithdrawReviewStep'

const steps = ['1. Configure', '2. Review']

export const EarnWithdraw = () => {
  const { poolId } = useParams<{ poolId: string }>()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState(0)

  if (!poolId) return null

  return (
    <div>
      <StepsNav steps={steps} activeIndex={step} ariaLabel="Withdraw progress" />

      {step === 0 && (
        <WithdrawConfigureStep
          poolId={poolId}
          amount={amount}
          onAmountChange={setAmount}
          onReview={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <WithdrawReviewStep
          poolId={poolId}
          amount={amount}
          onBack={() => setStep(0)}
          onConfirm={() => {
            // TODO: wire withdraw submission
          }}
        />
      )}
    </div>
  )
}
