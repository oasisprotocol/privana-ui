import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

export const BackHeader = ({
  title,
  onBack,
  disabled,
  action,
}: {
  title: string
  onBack: () => void
  disabled?: boolean
  action?: ReactNode
}) => (
  <div className="flex items-center gap-2">
    <div className="flex flex-1">
      <button
        type="button"
        onClick={onBack}
        disabled={disabled}
        aria-label="Back"
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
      >
        <ChevronLeft className="size-5" />
      </button>
    </div>
    <h1 className="text-center text-xl font-semibold tracking-tight text-foreground">{title}</h1>
    <div className="flex flex-1 justify-end">{action}</div>
  </div>
)
