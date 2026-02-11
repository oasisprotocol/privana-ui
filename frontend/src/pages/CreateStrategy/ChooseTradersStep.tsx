import { useNavigate } from 'react-router'
import TraderTable from '@/components/TraderTable'
import { StepNavigation } from './StepNavigation'
import { FC } from 'react'
import { StrategyData } from './types'

type ChooseTradersStepProps = {
  step: number
  setStep: (step: number) => void
  strategy: StrategyData
  setStrategy: (strategy: StrategyData) => void
}

export const ChooseTradersStep: FC<ChooseTradersStepProps> = ({ step, setStep, strategy, setStrategy }) => {
  const navigate = useNavigate()

  return (
    <>
      <div>
        <div className="text-foreground text-2xl font-medium mb-1.5">Choose traders to copy</div>
        <div className="max-w-87.5 text-muted-foreground text-sm font-normal">
          Select traders whose moves you want to mirror. Diversify across different styles for balanced risk.
        </div>
      </div>

      <TraderTable strategy={strategy} setStrategy={setStrategy} />

      <StepNavigation back={() => navigate(-1)} next={() => setStep(step + 1)} />
    </>
  )
}
