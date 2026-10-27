import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SuccessStateProps = {
  title: string
  message: string
  onDone: () => void
}

export const SuccessState = ({ title, message, onDone }: SuccessStateProps) => (
  <div className="flex flex-col animate-fade-in">
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-chart-positive/15 text-chart-positive animate-scale-in">
        <Check className="size-9" strokeWidth={3} />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
    <Button size="lg" className="mt-6 h-14 w-full text-base" onClick={onDone}>
      Back to dashboard
    </Button>
  </div>
)
