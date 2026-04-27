import { useState } from 'react'
import { useParams } from 'react-router'
import { StepsNav } from '@/components/StepsNav'
import { ConfigureStep } from './ConfigureStep'
import { ReviewStep } from './ReviewStep'

const steps = ['1. Configure', '2. Review']

export const EarnCreate = () => {
  const { poolId: initialPoolId } = useParams<{ poolId?: string }>()
  const [poolId, setPoolId] = useState<string | undefined>(initialPoolId)
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState(0)

  return (
    <div>
      <StepsNav steps={steps} activeIndex={step} ariaLabel="Earn progress" />

      {step === 0 && (
        <ConfigureStep
          poolId={poolId}
          amount={amount}
          onPoolIdChange={setPoolId}
          onAmountChange={setAmount}
          onReview={() => setStep(1)}
        />
      )}

      {step === 1 && poolId && (
        <ReviewStep
          poolId={poolId}
          amount={amount}
          onBack={() => setStep(0)}
          onConfirm={() => {
            // TODO: wire deposit submission
          }}
        />
      )}
    </div>
  )
}
