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

const ICON_CLASS: Record<Tone, string> = {
  green: 'bg-chart-positive/15 text-chart-positive',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  red: 'bg-destructive/15 text-destructive',
}

export const TONE_TEXT: Record<Tone, string> = {
  green: 'text-chart-positive',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-destructive',
}

export const TONE_SIGN: Record<Tone, string> = {
  green: '+',
  amber: '−',
  red: '−',
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
}): { Icon: LucideIcon; tone: Tone; iconClass: string } {
  if (params.status === 'failed') return { Icon: AlertCircle, tone: 'red', iconClass: ICON_CLASS.red }
  if (params.kind === 'transfer' && params.incoming) {
    return { Icon: ArrowDownLeft, tone: 'green', iconClass: ICON_CLASS.green }
  }
  const visual = KIND_VISUAL[params.kind]
  return { Icon: visual.icon, tone: visual.tone, iconClass: ICON_CLASS[visual.tone] }
}
