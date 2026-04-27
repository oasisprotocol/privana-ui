import { useState } from 'react'
import { useParams } from 'react-router'
import { StepsNav } from '@/components/StepsNav'
import { ConfigureStep } from './ConfigureStep'

const steps = ['1. Configure', '2. Review']

export const EarnCreate = () => {
  const { poolId: initialPoolId } = useParams<{ poolId?: string }>()
  const [poolId, setPoolId] = useState<string | undefined>(initialPoolId)
  const [amount, setAmount] = useState('')
  const [step] = useState(0)

  return (
    <div>
      <StepsNav steps={steps} activeIndex={step} ariaLabel="Earn progress" />

      <ConfigureStep
        poolId={poolId}
        amount={amount}
        onPoolIdChange={setPoolId}
        onAmountChange={setAmount}
        onReview={() => {
          // TODO: advance to review step
        }}
      />
    </div>
  )
}
