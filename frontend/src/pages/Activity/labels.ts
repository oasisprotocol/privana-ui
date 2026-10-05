import { appNameForAddress } from '@/config/apps'
import type { ActivityStatus } from '@/contexts/ActivityProvider/context'
import type { ClassifiedHistoryEntry, DisplayKind } from './historyMapping'
import type { FilterType } from './filters'

export type RowCopy = { title: string; subtitle?: string }

type MoveKind = 'deposit' | 'withdraw' | 'earnDeposit' | 'earnWithdraw'

// A completed row reads in the past tense and one in progress in the present
// continuous. A failed row says "… failed"; its line shows the failure reason.
const MOVES: Record<MoveKind, Record<ActivityStatus, RowCopy>> = {
  deposit: {
    completed: { title: 'Deposited to vault', subtitle: 'Added to Available' },
    'in-progress': { title: 'Depositing to vault', subtitle: 'Adding to Available…' },
    failed: { title: 'Deposit failed' },
  },
  withdraw: {
    completed: { title: 'Withdrawn', subtitle: 'Sent to external wallet' },
    'in-progress': { title: 'Withdrawing', subtitle: 'Sending to external wallet…' },
    failed: { title: 'Withdrawal failed' },
  },
  earnDeposit: {
    completed: { title: 'Moved to Earn', subtitle: 'Now earning' },
    'in-progress': { title: 'Moving to Earn', subtitle: 'Moving into Earn…' },
    failed: { title: 'Move to Earn failed' },
  },
  earnWithdraw: {
    completed: { title: 'Moved to Available', subtitle: 'Back from Earn' },
    'in-progress': { title: 'Moving to Available', subtitle: 'Returning to Available…' },
    failed: { title: 'Move to Available failed' },
  },
}

export const moveCopy = (kind: MoveKind, status: ActivityStatus): RowCopy => MOVES[kind][status]

export function swapCopy(status: ActivityStatus, toSymbol: string): RowCopy {
  const asset = toSymbol ? ` for ${toSymbol}` : ''
  switch (status) {
    case 'completed':
      return { title: `Swapped${asset}`, subtitle: 'No public trace' }
    case 'in-progress':
      return { title: `Swapping${asset}`, subtitle: 'Swapping privately…' }
    case 'failed':
      return { title: 'Swap failed' }
  }
}

// History only lists what already happened, so these rows are always completed.
const HISTORY_ONLY: Record<Exclude<DisplayKind, MoveKind | 'swap'>, RowCopy> = {
  lock: { title: 'Committed', subtitle: 'Under allowance policy' },
  lockModified: { title: 'Commitment increased', subtitle: 'Allowance increased' },
  lockReleased: { title: 'Released', subtitle: 'Returned to Available' },
  reclaimOut: { title: 'Locked Transfer Sent', subtitle: 'App consumed allowance' },
  reclaimIn: { title: 'Locked Transfer Received', subtitle: 'App credited lock' },
  transfer: { title: 'Sent', subtitle: 'Sent from vault' },
  unknown: { title: 'Activity', subtitle: 'Unrecognized activity' },
}

/** `status` is in-progress for a deposit not yet credited or a withdrawal not yet paid out. */
export function historyRowCopy(
  row: Pick<ClassifiedHistoryEntry, 'kind' | 'counterparty' | 'entry'>,
  status: ActivityStatus = 'completed',
): RowCopy {
  switch (row.kind) {
    case 'deposit':
    case 'withdraw':
    case 'earnDeposit':
    case 'earnWithdraw':
      return moveCopy(row.kind, status)
    case 'swap':
      return swapCopy('completed', '')
    case 'lock': {
      const name = appNameForAddress(row.counterparty)
      return name ? { ...HISTORY_ONLY.lock, title: `Committed to ${name}` } : HISTORY_ONLY.lock
    }
    case 'lockReleased': {
      const name = appNameForAddress(row.counterparty)
      return name
        ? { ...HISTORY_ONLY.lockReleased, title: `Released from ${name}` }
        : HISTORY_ONLY.lockReleased
    }
    case 'transfer':
      return row.entry.kind === 'transferBalanceIn'
        ? { title: 'Received', subtitle: 'Received to vault' }
        : HISTORY_ONLY.transfer
    default:
      return HISTORY_ONLY[row.kind]
  }
}

export const FILTER_TYPE_LABELS: Record<FilterType, string> = {
  all: 'All',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  swap: 'Swap',
  earn: 'Earn',
  earnDeposit: 'Move to Earn',
  earnWithdraw: 'Withdraw from Earn',
  lock: 'Lock',
  reclaim: 'Locked Transfer',
  transfer: 'Transfer',
}
