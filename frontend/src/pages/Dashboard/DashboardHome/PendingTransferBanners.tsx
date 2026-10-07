import { ChevronRight, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { activityPath } from '@/paths'
import { usePendingTransfers, type PendingTransfer } from '@/hooks/usePendingTransfers'
import { pendingTransferCopy } from './pendingTransferCopy'

const BANNER_CLASS =
  'flex w-full items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-left shadow-[var(--card-shadow)] transition-colors hover:bg-muted dark:bg-card'

const BannerContent = ({ transfer }: { transfer: PendingTransfer }) => {
  const { title, detail } = pendingTransferCopy(transfer)
  return (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
        <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </>
  )
}

export const PendingTransferBanners = ({
  onOpenDeposit,
  className,
}: {
  /** Reopens the deposit modal, which follows the deposit in flight. */
  onOpenDeposit: () => void
  className?: string
}) => {
  const transfers = usePendingTransfers()
  if (transfers.length === 0) return null
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {transfers.map(transfer =>
        transfer.kind === 'deposit' ? (
          <button key={transfer.key} type="button" onClick={onOpenDeposit} className={BANNER_CLASS}>
            <BannerContent transfer={transfer} />
          </button>
        ) : (
          <Link key={transfer.key} to={activityPath()} viewTransition className={BANNER_CLASS}>
            <BannerContent transfer={transfer} />
          </Link>
        ),
      )}
    </div>
  )
}
