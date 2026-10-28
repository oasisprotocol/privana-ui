import { ChevronLeft } from 'lucide-react'

export const BackHeader = ({
  title,
  onBack,
  disabled,
}: {
  title: string
  onBack: () => void
  disabled?: boolean
}) => (
  <div className="relative flex items-center justify-center">
    <button
      type="button"
      onClick={onBack}
      disabled={disabled}
      aria-label="Back"
      className="absolute left-0 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
    >
      <ChevronLeft className="size-5" />
    </button>
    <h1 className="text-xl font-semibold text-foreground">{title}</h1>
  </div>
)
