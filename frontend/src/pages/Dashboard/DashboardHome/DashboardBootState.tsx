import { useEffect, useState } from 'react'
import { Blocks, LockKeyhole, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BootPhase } from './useBootPhase'

const STEPS: { icon: LucideIcon; label: string }[] = [
  { icon: Blocks, label: 'Fetching from chain…' },
  { icon: LockKeyhole, label: 'Decrypting on your device…' },
  { icon: Sparkles, label: 'Almost ready…' },
]
const HOLD_MS = 2200 // how long a stage stays before it slides out
const OUT_MS = 200 // must match the label-slide-out duration in index.css

const IconBadge = ({ icon: Icon }: { icon: LucideIcon }) => (
  <span className="flex size-14 items-center justify-center rounded-full bg-muted">
    <Icon className="size-7 text-muted-foreground" />
  </span>
)

export const DashboardBootState = ({ phase }: { phase: Exclude<BootPhase, 'done'> }) => {
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (phase !== 'loading' || index >= STEPS.length - 1) return
    const hold = setTimeout(() => setLeaving(true), HOLD_MS)
    return () => clearTimeout(hold)
  }, [phase, index])

  useEffect(() => {
    if (!leaving) return
    const out = setTimeout(() => {
      setIndex(i => Math.min(i + 1, STEPS.length - 1))
      setLeaving(false)
    }, OUT_MS)
    return () => clearTimeout(out)
  }, [leaving])

  return (
    <div className="flex min-h-100 w-full flex-col items-center justify-center px-6 text-center">
      {phase === 'confirming' ? (
        <div key="confirm" className="animate-label-slide-in flex flex-col items-center">
          <IconBadge icon={ShieldCheck} />
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">You&apos;re all set</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your private account is ready.</p>
        </div>
      ) : (
        <div
          key={index}
          className={cn(
            'flex flex-col items-center',
            leaving ? 'animate-label-slide-out' : 'animate-label-slide-in',
          )}
        >
          <IconBadge icon={STEPS[index].icon} />
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{STEPS[index].label}</h2>
        </div>
      )}
    </div>
  )
}
