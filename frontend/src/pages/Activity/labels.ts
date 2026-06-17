import type { DisplayKind } from './historyMapping'

export const ACTIVITY_TITLES: Record<DisplayKind, string> = {
  swap: 'Swap',
  earnDeposit: 'Move to Earn',
  earnWithdraw: 'Withdraw from Earn',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  lock: 'Lock',
  lockModified: 'Lock - Modified',
  lockReleased: 'Lock - Released',
  reclaim: 'Reclaim',
  transfer: 'Transfer',
  unknown: 'Activity',
}

export const ACTIVITY_AMOUNT_LABELS: Record<DisplayKind, string> = {
  swap: 'Sent to swap pool',
  earnDeposit: 'Deposited',
  earnWithdraw: 'Withdrew',
  deposit: 'Deposited',
  withdraw: 'Withdrew',
  lock: 'Locked',
  lockModified: 'Locked',
  lockReleased: 'Returned',
  reclaim: 'Reclaimed',
  transfer: 'Transferred',
  unknown: 'Amount',
}
