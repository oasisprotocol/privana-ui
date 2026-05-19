import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Option<V extends string> = { value: V; label: string; leading?: ReactNode }

type Props<V extends string> = {
  label: string
  options: readonly Option<V>[]
  value: V
  onChange: (v: V) => void
}

export function FilterChipGroup<V extends string>({ label, options, value, onChange }: Props<V>) {
  return (
    <div className="flex items-start gap-3 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground w-20 shrink-0 pt-1">{label}:</span>
      <div className="flex items-center gap-2 flex-wrap">
        {options.map(opt => {
          const isActive = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'inline-flex items-center gap-1.5 h-7 pl-2 pr-3 rounded-full text-sm font-medium transition-colors',
                opt.leading == null && 'pl-3',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-accent',
              )}
            >
              {opt.leading}
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
