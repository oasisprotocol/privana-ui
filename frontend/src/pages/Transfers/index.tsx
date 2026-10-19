import { useMemo } from 'react'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { useConnection } from 'wagmi'
import { useEarnPools } from '@/api/earn'
import { ActivityList } from '@/components/ActivityList'
import { CopyButton } from '@/components/CopyButton'
import { SurfaceCard } from '@/components/SurfaceCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { appForAddress } from '@/config/apps'
import { type MergedRow, useMergedActivity } from '@/hooks/use-merged-activity'
import { activityPath } from '@/paths'

const MAX_TRANSFERS = 5

const isUserTransfer = (row: MergedRow): boolean =>
  row.source === 'chain' && row.row.kind === 'transfer' && !appForAddress(row.row.counterparty)

const AddressCard = () => {
  const { address } = useConnection()

  return (
    <SurfaceCard className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-muted-foreground">Your internal transfer address</p>
        {address ? (
          <div className="flex items-center gap-1">
            <span className="min-w-0 break-all font-mono text-sm text-foreground sm:text-base">
              <span className="font-semibold">{address.slice(0, 6)}</span>
              <span className="text-muted-foreground">{address.slice(6, -4)}</span>
              <span className="font-semibold">{address.slice(-4)}</span>
            </span>
            <CopyButton value={address} label="Copy address" />
          </div>
        ) : (
          <Skeleton className="h-7 w-full max-w-110" />
        )}
        <p className="text-xs text-muted-foreground">Same as the wallet you signed in with.</p>
      </div>
      <p className="rounded-xl bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
        Only transfers made inside Privana arrive here. A normal send from a wallet or exchange goes to your
        wallet, not to your Privana balance.
      </p>
    </SurfaceCard>
  )
}

const RecentTransfers = () => {
  const { rows, isLoading, isError, refetch } = useMergedActivity()
  const { data: pools } = useEarnPools()
  const transfers = useMemo(() => (pools ? rows.filter(isUserTransfer) : []), [rows, pools])

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent transfers</h2>
        <Link
          to={activityPath()}
          viewTransition
          className="text-sm font-medium text-foreground hover:underline"
        >
          See all in Activity
        </Link>
      </div>
      <ActivityList
        rows={transfers}
        isLoading={isLoading || !pools}
        isError={isError}
        onRetry={refetch}
        max={MAX_TRANSFERS}
        emptyState={
          <SurfaceCard className="flex flex-col gap-1 p-6 text-center">
            <p className="text-sm font-medium text-foreground">No internal transfers yet</p>
            <p className="text-sm text-muted-foreground">Transfers you send or receive will appear here.</p>
          </SurfaceCard>
        }
      />
    </section>
  )
}

export const Transfers = () => (
  <div className="mx-auto flex w-full max-w-200 flex-col gap-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Internal transfers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Send funds to anyone on Privana. Instant, no gas.
        </p>
      </div>
      <Button disabled className="shrink-0">
        <Plus />
        New internal transfer
      </Button>
    </header>

    <AddressCard />

    <RecentTransfers />
  </div>
)
