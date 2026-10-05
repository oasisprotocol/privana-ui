import { AlertCircle, Check, Clock, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NotificationTone } from './notifications'

const TONE: Record<NotificationTone, { Icon: LucideIcon; className: string }> = {
  success: { Icon: Check, className: 'bg-chart-positive/15 text-chart-positive' },
  warning: { Icon: Clock, className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  failure: { Icon: AlertCircle, className: 'bg-destructive/15 text-destructive' },
}

export const NotificationToast = ({
  tone,
  title,
  detail,
  onDismiss,
}: {
  tone: NotificationTone
  title: string
  detail: string
  onDismiss: () => void
}) => {
  const { Icon, className } = TONE[tone]
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border bg-popover px-3.5 py-3 text-popover-foreground shadow-lg">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', className)}>
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
