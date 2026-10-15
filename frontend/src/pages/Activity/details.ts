import type { DepositProgress } from '@oasisprotocol/privana-sdk'
import type { MergedRow } from '@/hooks/use-merged-activity'
import { pendingDepositKey, pendingDepositTxHash } from '@/hooks/usePendingTransfers'
import { operationIdOf } from '@/api/operations'
import { sameId } from '@/lib/utils'
import { statusOf } from './filters'
import { historyRowCopy, moveCopy, swapCopy } from './labels'

export const detailsIdOf = (row: MergedRow): string | null => {
  if (row.source === 'chain') return `h-${row.row.index}`
  if (row.source === 'local') {
    const operationId = operationIdOf(row.activity)
    return operationId ? `op-${operationId}` : null
  }
  // A deposit on its way, by its source transaction, until it is credited.
  const txHash = pendingDepositTxHash(row.key)
  return txHash ? `dep-${txHash}` : null
}

export type DetailsRef =
  | { source: 'operation'; operationId: string }
  | { source: 'history'; index: number }
  | { source: 'deposit'; txHash: string }

export const parseDetailsId = (id: string): DetailsRef | null => {
  if (id.startsWith('op-') && id.length > 3) return { source: 'operation', operationId: id.slice(3) }
  if (id.startsWith('dep-') && id.length > 4) return { source: 'deposit', txHash: id.slice(4) }
  const history = /^h-(\d+)$/.exec(id)
  return history ? { source: 'history', index: Number(history[1]) } : null
}

export const findDetailsRow = (
  rows: MergedRow[],
  ref: DetailsRef,
  progress?: DepositProgress | null,
): MergedRow | undefined => {
  if (ref.source === 'operation') {
    return rows.find(row => row.source === 'local' && operationIdOf(row.activity) === ref.operationId)
  }
  if (ref.source === 'history') {
    return rows.find(row => row.source === 'chain' && row.row.index === ref.index)
  }
  const pending = rows.find(row => row.source === 'pending' && row.key === pendingDepositKey(ref.txHash))
  if (pending) return pending
  const depositId = sameId(progress?.txHash, ref.txHash) ? progress?.depositId : undefined
  return rows.find(row => row.source === 'chain' && sameId(row.row.entry.deposit_id, depositId))
}

export const detailsTitle = (row: MergedRow): string => {
  if (row.source === 'local') {
    const a = row.activity
    if (a.type === 'swap') return swapCopy(a.status, a.toToken.symbol).title
    return moveCopy(a.direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw', a.status).title
  }
  return historyRowCopy(row.row, statusOf(row)).title
}

const IN_PROGRESS_NOTE = 'This can take a few minutes. You can safely leave this screen.'

export const progressLine = (subtitle?: string): string => `${subtitle ?? ''} ${IN_PROGRESS_NOTE}`.trim()
