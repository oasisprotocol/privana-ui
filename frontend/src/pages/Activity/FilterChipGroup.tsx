import { cn } from '@/lib/utils'

type Option<V extends string> = { value: V; label: string }

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
                'h-7 px-3 rounded-full text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-accent',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
