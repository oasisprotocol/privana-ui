import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  </div>
)
