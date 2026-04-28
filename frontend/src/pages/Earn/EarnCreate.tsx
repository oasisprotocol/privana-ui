import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { StepsNav } from '@/components/StepsNav'
import { earnCreatePath } from '@/paths'
import { ConfigureStep } from './ConfigureStep'
import { ReviewStep } from './ReviewStep'

const steps = ['1. Configure', '2. Review']

export const EarnCreate = () => {
  const { poolId } = useParams<{ poolId?: string }>()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState(0)

  const handlePoolIdChange = (id: string | undefined) => {
    navigate(earnCreatePath(id), { replace: true })
  }

  return (
    <div>
      <StepsNav steps={steps} activeIndex={step} ariaLabel="Earn progress" />

      {step === 0 && (
        <ConfigureStep
          poolId={poolId}
          amount={amount}
          onPoolIdChange={handlePoolIdChange}
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
