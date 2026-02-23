import { StepNavigation } from './StepNavigation'
import { FC } from 'react'
import { StrategyData } from './types'
import { Separator } from '@/components/ui/separator'

type SummaryStepProps = {
  step: number
  setStep: (step: number) => void
  strategy: StrategyData
}

const DataField: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-4 text-sm font-medium">
    <span className="text-tertiary-foreground">{label}</span>
    <span className="text-foreground">{value}</span>
  </div>
)

export const SummaryStep: FC<SummaryStepProps> = ({ step, setStep, strategy }) => {
  return (
    <div className="flex flex-col gap-6 max-w-145 m-auto">
      <div>
        <div className="text-foreground text-2xl font-medium mb-1.5">Strategy summary</div>
        <div className="max-w-87.5 text-muted-foreground text-sm font-normal">
          Please review strategy details and confirm.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-5 text-sm font-medium">
        <DataField label="Name" value={strategy.name} />
        <DataField label="Traders" value={`${strategy.traders.length} selected`} />
        <DataField label="Amount" value={`${strategy.amount} USDC`} />
        <DataField label="Rebalance" value="Daily" />
        <DataField label="Est. fees" value="n/a" />
        <DataField label="Network fee" value="n/a" />
      </div>

      <Separator />

      <p className="text-sm text-muted-foreground">
        Copy trading involves risk. Past performance doesn't guarantee future results.
      </p>

      <StepNavigation back={() => setStep(step - 1)} next={() => setStep(step + 1)} />
    </div>
  )
}
