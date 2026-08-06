import { appNameForAddress } from '@/config/apps'
import type { ActivityStatus } from '@/contexts/ActivityProvider/context'
import type { ClassifiedHistoryEntry, DisplayKind } from './historyMapping'
import type { FilterType } from './filters'

export const ACTIVITY_TITLES: Record<DisplayKind, string> = {
  swap: 'Swap',
  earnDeposit: 'Move to Earn',
  earnWithdraw: 'Withdraw from Earn',
  deposit: 'Deposit to vault',
  withdraw: 'Withdrawal',
  lock: 'Committed',
  lockModified: 'Commitment increased',
  lockReleased: 'Released',
  reclaimOut: 'Locked Transfer Sent',
  reclaimIn: 'Locked Transfer Received',
  transfer: 'Sent',
  unknown: 'Activity',
}

export function activityRowTitle(
  row: Pick<ClassifiedHistoryEntry, 'kind' | 'counterparty' | 'entry'>,
): string {
  switch (row.kind) {
    case 'lock': {
      const name = appNameForAddress(row.counterparty)
      return name ? `Committed to ${name}` : ACTIVITY_TITLES.lock
    }
    case 'lockReleased': {
      const name = appNameForAddress(row.counterparty)
      return name ? `Released from ${name}` : ACTIVITY_TITLES.lockReleased
    }
    case 'transfer':
      return row.entry.kind === 'transferBalanceIn' ? 'Received' : 'Sent'
    default:
      return ACTIVITY_TITLES[row.kind]
  }
}

const ACTIVITY_SUBTITLES: Record<DisplayKind, string> = {
  swap: 'Swapped in your vault',
  earnDeposit: 'Put to work in Earn',
  earnWithdraw: 'Returned to Available',
  deposit: 'No lock — stays available',
  withdraw: 'To external wallet',
  lock: 'Under allowance policy',
  lockModified: 'Allowance increased',
  lockReleased: 'Returned to Available',
  reclaimOut: 'App consumed allowance',
  reclaimIn: 'App credited lock',
  transfer: 'Sent from vault',
  unknown: 'Unrecognized activity',
}

export function activityRowSubtitle(params: {
  kind: DisplayKind
  incoming?: boolean
  status?: ActivityStatus
}): string {
  if (params.status === 'in-progress') return 'Pending'
  if (params.status === 'failed') return 'Failed'
  if (params.kind === 'transfer') return params.incoming ? 'Received to vault' : 'Sent from vault'
  return ACTIVITY_SUBTITLES[params.kind]
}

export const FILTER_TYPE_LABELS: Record<FilterType, string> = {
  all: 'All',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  swap: ACTIVITY_TITLES.swap,
  earn: 'Earn',
  earnDeposit: ACTIVITY_TITLES.earnDeposit,
  earnWithdraw: ACTIVITY_TITLES.earnWithdraw,
  lock: 'Lock',
  reclaim: 'Locked Transfer',
  transfer: 'Transfer',
}
