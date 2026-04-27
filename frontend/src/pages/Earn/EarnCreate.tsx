import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useParams } from 'react-router'
import { cn } from '@/lib/utils'
import { ConfigureStep } from './ConfigureStep'

const steps = ['1. Configure', '2. Review']

export const EarnCreate = () => {
  const { poolId: initialPoolId } = useParams<{ poolId?: string }>()
  const [poolId, setPoolId] = useState<string | undefined>(initialPoolId)
  const [amount, setAmount] = useState('')
  const [step] = useState(0)

  return (
    <div>
      <nav aria-label="Earn progress" className="flex items-center justify-center gap-1 w-full mb-4">
        {steps.map((label, i) => (
          <div
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className={cn(
              'flex items-center justify-center gap-1 h-8 pl-2.5 pr-4 py-2 rounded-md text-sm font-medium',
              i === step ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {i > 0 && <ChevronRight className="size-4" />}
            <span>{label}</span>
          </div>
        ))}
      </nav>

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
