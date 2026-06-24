import type { DisplayKind } from './historyMapping'
import type { FilterType } from './filters'

export const ACTIVITY_TITLES: Record<DisplayKind, string> = {
  swap: 'Swap',
  earnDeposit: 'Move to Earn',
  earnWithdraw: 'Withdraw from Earn',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  lock: 'Lock',
  lockModified: 'Lock - Modified',
  lockReleased: 'Lock - Released',
  reclaimOut: 'Locked Transfer Sent',
  reclaimIn: 'Locked Transfer Received',
  transfer: 'Transfer',
  unknown: 'Activity',
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
  deposit: ACTIVITY_TITLES.deposit,
  withdraw: ACTIVITY_TITLES.withdraw,
  swap: ACTIVITY_TITLES.swap,
  earn: 'Earn',
  earnDeposit: ACTIVITY_TITLES.earnDeposit,
  earnWithdraw: ACTIVITY_TITLES.earnWithdraw,
  lock: ACTIVITY_TITLES.lock,
  reclaim: 'Locked Transfer',
  transfer: ACTIVITY_TITLES.transfer,
}
