import { useNavigate } from 'react-router'
import { TraderTable } from '@/components/TraderTable'
import { StepNavigation } from './StepNavigation'
import { FC } from 'react'
import { StrategyData } from './types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ChooseTradersStepProps = {
  step: number
  setStep: (step: number) => void
  strategy: StrategyData
  setStrategy: (strategy: StrategyData) => void
}

export const ChooseTradersStep: FC<ChooseTradersStepProps> = ({ step, setStep, strategy, setStrategy }) => {
  const navigate = useNavigate()
  const isLoading = false

  return (
    <>
      <div>
        <div className="text-foreground text-2xl font-medium mb-1.5">Choose traders to copy</div>
        <div className="max-w-87.5 text-muted-foreground text-sm font-normal">
          Select traders whose moves you want to mirror. Diversify across different styles for balanced risk.
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="max-w-95 flex flex-col gap-2 items-start">
          <Label htmlFor="address-search" className="font-medium">
            Search for specific address
          </Label>
          <Input id="address-search" placeholder='e.g., "0x71F3wef34r3r2a92b"' className="w-full" />
        </div>

        <TraderTable isLoading={isLoading} strategy={strategy} setStrategy={setStrategy} />
      </div>

      <StepNavigation disabled={isLoading} back={() => navigate(-1)} next={() => setStep(step + 1)} />
    </>
  )
}
