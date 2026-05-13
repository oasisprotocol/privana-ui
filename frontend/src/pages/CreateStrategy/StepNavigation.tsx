import { Button } from '@oasisprotocol/privana-sdk'

type StepNavigationProps = {
  back: () => void
  next: () => void
  disabled?: boolean
  step?: number
}

export const StepNavigation: React.FC<StepNavigationProps> = ({ back, next, disabled, step }) => {
  return (
    <div className={'flex flex-col sm:flex-row gap-6 justify-center'}>
      <Button disabled={disabled} variant="secondary" onClick={back} className="w-full sm:w-70">
        {step === 0 ? 'Cancel' : 'Back'}
      </Button>
      <Button disabled={disabled} variant="default" onClick={next} className="w-full sm:w-70">
        Next
      </Button>
    </div>
  )
}
