import type { ReactNode } from 'react'
import { ChevronLeft, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SurfaceCard } from '@/components/SurfaceCard'
import { Row } from '@/components/Row'
import { cn } from '@/lib/utils'

// Shared chrome for the deposit / withdraw "Review move" screens.

export const ReviewHeader = ({
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
    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
  </div>
)

export const ReviewAmountCard = ({
  eyebrow,
  amount,
  symbol,
  subline,
}: {
  eyebrow: string
  amount: string
  symbol: string
  subline: ReactNode
}) => (
  <SurfaceCard className="p-6">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
    <div className="mt-1 flex items-baseline gap-2">
      <span className="text-4xl font-semibold tracking-tight tabular-nums text-foreground">{amount}</span>
      {symbol && <span className="text-xl font-semibold text-muted-foreground">{symbol}</span>}
    </div>
    <p className="mt-1 text-sm text-muted-foreground">{subline}</p>
  </SurfaceCard>
)

export type ReviewDetailRow = { label: string; value: ReactNode; muted?: boolean }

export const ReviewDetails = ({ header, rows }: { header?: ReactNode; rows: ReviewDetailRow[] }) => (
  <SurfaceCard className="flex flex-col px-5">
    {header && <div className="border-b border-border py-4">{header}</div>}
    {rows.map((r, i) => (
      <Row
        key={r.label}
        size="md"
        mutedValue={r.muted}
        label={r.label}
        value={r.value}
        className={cn('py-3.5', i < rows.length - 1 && 'border-b border-border')}
      />
    ))}
  </SurfaceCard>
)

export const ReviewDisclaimer = ({ children }: { children: ReactNode }) => (
  <div className="flex gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
    <p className="text-xs text-muted-foreground">{children}</p>
  </div>
)

// Switches to "Switch Network" on the wrong chain, otherwise the confirm action.
export const ReviewConfirmButton = ({
  isCorrectChain,
  onSwitchChain,
  onConfirm,
  disabled,
  loading,
  label,
  loadingLabel = 'Submitting...',
}: {
  isCorrectChain: boolean
  onSwitchChain: () => void
  onConfirm: () => void
  disabled?: boolean
  loading?: boolean
  label: string
  loadingLabel?: string
}) =>
  !isCorrectChain ? (
    <Button size="lg" className="h-12 w-full text-base" onClick={onSwitchChain} disabled={loading}>
      Switch Network
    </Button>
  ) : (
    <Button size="lg" className="h-12 w-full text-base" onClick={onConfirm} disabled={disabled}>
      {loading ? loadingLabel : label}
    </Button>
  )
