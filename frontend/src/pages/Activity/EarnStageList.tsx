import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EarnStageStep } from './earnStages'

const TIME = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export const EarnStageList = ({ steps }: { steps: EarnStageStep[] }) => (
  <ol className="mt-3 flex flex-col gap-1.5" aria-label="Progress">
    {steps.map(step => (
      <li
        key={step.stage}
        aria-current={step.state === 'active' ? 'step' : undefined}
        className={cn(
          'flex items-center gap-2 text-xs',
          step.state === 'upcoming' ? 'text-muted-foreground/60' : 'text-muted-foreground',
          step.state === 'active' && 'font-medium text-foreground',
        )}
      >
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-full border',
            step.state === 'done' && 'border-chart-positive bg-chart-positive text-white',
            step.state === 'active' && 'border-primary',
            step.state === 'upcoming' && 'border-muted-foreground/30',
          )}
        >
          {step.state === 'done' && <Check className="size-3" />}
          {step.state === 'active' && <span className="size-1.5 animate-pulse rounded-full bg-primary" />}
        </span>
        <span className="min-w-0 flex-1 truncate">{step.label}</span>
        {step.at != null && (
          <span className="shrink-0 tabular-nums">{TIME.format(new Date(step.at * 1000))}</span>
        )}
      </li>
    ))}
  </ol>
)
