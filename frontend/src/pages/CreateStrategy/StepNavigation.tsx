import { Button } from '@oasisprotocol/flexvaults-sdk'

type StepNavigationProps = {
  back: () => void
  next: () => void
}

export const StepNavigation: React.FC<StepNavigationProps> = ({ back, next }) => {
  return (
    <div className={'flex flex-col sm:flex-row gap-6 justify-center'}>
      <Button variant="secondary" onClick={back} className="w-full sm:w-70">
        Cancel
      </Button>
      <Button variant="default" onClick={next} className="w-full sm:w-70">
        Next
      </Button>
    </div>
  )
}
