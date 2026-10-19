import { Plus } from 'lucide-react'
import { useConnection } from 'wagmi'
import { CopyButton } from '@/components/CopyButton'
import { SurfaceCard } from '@/components/SurfaceCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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
  </div>
)
