import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { SurfaceCard } from '@/components/SurfaceCard'
import { cn } from '@/lib/utils'

// Verbatim from product: spell out what the wait is actually doing, since a
// private portfolio is genuinely slow to read from the chain.
const STAGES = [
  'Fetching your private portfolio and history from the chain',
  'Decrypting data locally',
  'Almost ready',
] as const

// Confidential reads give no real progress signal, so the messages advance on a
// timer. VISIBLE holds the current one; SLIDE is how long its exit takes before
// the next slides in.
const VISIBLE_MS = 2200
const SLIDE_MS = 300

// Matches the loaded balance card's height so loading happens in place, with no
// jump when the real content swaps in.
const MIN_HEIGHT = 'min-h-[366px]'

export const DashboardLoading = () => {
  const [stage, setStage] = useState(0)
  const [entering, setEntering] = useState(true)
  const isLast = stage >= STAGES.length - 1

  // Hold the message, then start its slide-out — unless it's the terminal step,
  // which stays put (the spinner carries the "still working" signal while the
  // chain read finishes on its own schedule).
  useEffect(() => {
    if (isLast) return
    const hold = setTimeout(() => setEntering(false), VISIBLE_MS)
    return () => clearTimeout(hold)
  }, [stage, isLast])

  // Once the slide-out has played, swap to the next message and slide it in.
  useEffect(() => {
    if (entering) return
    const swap = setTimeout(() => {
      setStage(s => s + 1)
      setEntering(true)
    }, SLIDE_MS)
    return () => clearTimeout(swap)
  }, [entering])

  return (
    <SurfaceCard className={cn('flex w-full flex-col p-6 animate-fade-in md:rounded-3xl md:p-8', MIN_HEIGHT)}>
      <span className="text-sm font-medium text-muted-foreground">Total balance</span>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />

        <div className="flex min-h-[2.5rem] items-center justify-center">
          <p
            className={cn(
              'text-sm font-medium text-foreground',
              entering
                ? 'animate-in fade-in-0 slide-in-from-bottom-2 duration-300'
                : 'animate-out fade-out-0 slide-out-to-top-2 fill-mode-forwards duration-300',
            )}
          >
            {STAGES[stage]}
          </p>
        </div>

        <p className="max-w-xs text-xs text-muted-foreground">
          Your balances are private, so this takes a moment.
        </p>
      </div>
    </SurfaceCard>
  )
}
