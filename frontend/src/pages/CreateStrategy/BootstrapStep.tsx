import { FC } from 'react'
import { StrategyData } from './types'

type BootstrapStepProps = {
  strategy: StrategyData
}

export const BootstrapStep: FC<BootstrapStepProps> = ({ strategy }) => {
  console.log(strategy)
  return (
    <div className="flex flex-col gap-6 max-w-145 m-auto">
      <div>
        <div className="text-foreground text-2xl font-medium mb-1.5">Your strategy is being created</div>
        <div className="max-w-87.5 text-muted-foreground text-sm font-normal">
          Fund your wallet to start trading.
        </div>
      </div>
    </div>
  )
}
