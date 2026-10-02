import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ArrowUpRight,
  CircleHelp,
  Layers,
  Minus,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import type { DisplayKind } from './historyMapping'

const KIND_ICON: Record<DisplayKind, LucideIcon> = {
  deposit: ArrowDownToLine,
  withdraw: ArrowUpFromLine,
  earnDeposit: Plus,
  earnWithdraw: Minus,
  swap: ArrowLeftRight,
  transfer: ArrowUpRight,
  reclaimIn: ArrowDownLeft,
  reclaimOut: ArrowUpRight,
  lock: Layers,
  lockModified: Layers,
  lockReleased: Minus,
  unknown: CircleHelp,
}

export function activityIcon(kind: DisplayKind, incoming?: boolean): LucideIcon {
  if (kind === 'transfer' && incoming) return ArrowDownLeft
  return KIND_ICON[kind]
}
