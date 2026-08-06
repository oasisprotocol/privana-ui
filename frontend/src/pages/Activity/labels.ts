import { appNameForAddress } from '@/config/apps'
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

export const ACTIVITY_AMOUNT_LABELS: Record<DisplayKind, string> = {
  swap: 'Sent to swap pool',
  // earnDeposit/earnWithdraw are rendered by AmountLabel as a "Wallet → Earn"
  // direction with an icon arrow; these strings are plain-text fallbacks only.
  earnDeposit: 'Wallet to Earn',
  earnWithdraw: 'Earn to Wallet',
  deposit: 'Amount',
  withdraw: 'Amount',
  lock: 'Locked',
  lockModified: 'Locked',
  lockReleased: 'Returned',
  reclaimOut: 'Sent from lock',
  reclaimIn: 'Received from lock',
  transfer: 'Transferred',
  unknown: 'Amount',
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
