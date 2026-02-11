import { StepNavigation } from './StepNavigation'
import { FC } from 'react'
import { StrategyData } from './types'

type SettingsStepProps = {
  step: number
  setStep: (step: number) => void
  strategy: StrategyData
  setStrategy: (strategy: StrategyData) => void
}

export const SettingsStep: FC<SettingsStepProps> = ({ step, setStep, strategy, setStrategy }) => {
  return (
    <>
      <div>
        <div className="text-foreground text-2xl font-medium mb-1.5">New copy trading strategy</div>
        <div className="max-w-87.5 text-muted-foreground text-sm font-normal">
          Fund your wallet to start trading.
        </div>
      </div>
      FORM
      <StepNavigation back={() => setStep(step - 1)} next={() => setStep(step + 1)} />
    </>
  )
}
