import { ChevronRight, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router'
import type { MergedRow } from '@/hooks/use-merged-activity'
import { cn } from '@/lib/utils'
import { activityDetailsPath, activityPath } from '@/paths'
import { usePendingTransfers, type PendingTransfer } from '@/hooks/usePendingTransfers'
import { pendingTransferDetailsId } from '@/pages/Activity/details'
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
  rows,
  className,
}: {
  /** Activity rows, to find a pending withdrawal's history entry. */
  rows: readonly MergedRow[]
  className?: string
}) => {
  const transfers = usePendingTransfers()
  if (transfers.length === 0) return null
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {transfers.map(transfer => {
        // Activity until the withdrawal's history entry has loaded.
        const detailsId = pendingTransferDetailsId(transfer, rows)
        return (
          <Link
            key={transfer.key}
            to={detailsId ? activityDetailsPath(detailsId) : activityPath()}
            viewTransition
            className={BANNER_CLASS}
          >
            <BannerContent transfer={transfer} />
          </Link>
        )
      })}
    </div>
  )
}
