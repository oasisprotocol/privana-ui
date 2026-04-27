import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type StepsNavProps = {
  steps: readonly string[]
  activeIndex: number
  ariaLabel?: string
  className?: string
}

export const StepsNav = ({ steps, activeIndex, ariaLabel = 'Progress', className }: StepsNavProps) => (
  <nav aria-label={ariaLabel} className={cn('flex items-center justify-center gap-1 w-full mb-4', className)}>
    {steps.map((label, i) => (
      <div
        key={label}
        aria-current={i === activeIndex ? 'step' : undefined}
        className={cn(
          'flex items-center justify-center gap-1 h-8 pl-2.5 pr-4 py-2 rounded-md text-sm font-medium',
          i === activeIndex ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {i > 0 && <ChevronRight className="size-4" />}
        <span>{label}</span>
      </div>
    ))}
  </nav>
)
