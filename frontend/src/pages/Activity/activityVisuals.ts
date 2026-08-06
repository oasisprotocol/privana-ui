import {
  AlertCircle,
  ArrowDown,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CornerDownLeft,
  Lock,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityStatus } from '@/contexts/ActivityProvider/context'
import type { DisplayKind } from './historyMapping'

type Tone = 'green' | 'amber' | 'red'

const TONE_CLASS: Record<Tone, string> = {
  green: 'bg-chart-positive/15 text-chart-positive',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  red: 'bg-destructive/15 text-destructive',
}

const KIND_VISUAL: Record<DisplayKind, { icon: LucideIcon; tone: Tone }> = {
  deposit: { icon: ArrowDown, tone: 'green' },
  earnWithdraw: { icon: TrendingDown, tone: 'green' },
  lockReleased: { icon: CornerDownLeft, tone: 'green' },
  swap: { icon: ArrowLeftRight, tone: 'green' },
  reclaimIn: { icon: ArrowDownLeft, tone: 'green' },
  withdraw: { icon: ArrowUpRight, tone: 'amber' },
  earnDeposit: { icon: TrendingUp, tone: 'amber' },
  lock: { icon: Lock, tone: 'amber' },
  lockModified: { icon: Lock, tone: 'amber' },
  transfer: { icon: ArrowUpRight, tone: 'amber' },
  reclaimOut: { icon: ArrowUpRight, tone: 'amber' },
  unknown: { icon: AlertCircle, tone: 'red' },
}

export function resolveActivityVisual(params: {
  kind: DisplayKind
  incoming?: boolean
  status?: ActivityStatus
}): { Icon: LucideIcon; toneClass: string } {
  if (params.status === 'failed') return { Icon: AlertCircle, toneClass: TONE_CLASS.red }
  if (params.kind === 'transfer' && params.incoming) {
    return { Icon: ArrowDownLeft, toneClass: TONE_CLASS.green }
  }
  const visual = KIND_VISUAL[params.kind]
  return { Icon: visual.icon, toneClass: TONE_CLASS[visual.tone] }
}
