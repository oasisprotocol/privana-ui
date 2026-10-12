import type { MergedRow } from '@/hooks/use-merged-activity'
import type { Activity } from '@/contexts/ActivityProvider/context'
import { historyRowCopy, moveCopy, swapCopy } from './labels'

export const operationIdOf = (a: Activity): string | undefined =>
  a.type === 'swap' ? a.swapId : a.direction === 'deposit' ? a.depositId : a.withdrawId

export const detailsIdOf = (row: MergedRow): string | null => {
  if (row.source === 'chain') return `h-${row.row.index}`
  if (row.source === 'local') {
    const operationId = operationIdOf(row.activity)
    return operationId ? `op-${operationId}` : null
  }
  return null
}

export type DetailsRef = { source: 'operation'; operationId: string } | { source: 'history'; index: number }

export const parseDetailsId = (id: string): DetailsRef | null => {
  if (id.startsWith('op-') && id.length > 3) return { source: 'operation', operationId: id.slice(3) }
  const history = /^h-(\d+)$/.exec(id)
  return history ? { source: 'history', index: Number(history[1]) } : null
}

export const findDetailsRow = (rows: MergedRow[], ref: DetailsRef): MergedRow | undefined =>
  rows.find(row =>
    ref.source === 'operation'
      ? row.source === 'local' && operationIdOf(row.activity) === ref.operationId
      : row.source === 'chain' && row.row.index === ref.index,
  )

export const detailsTitle = (row: MergedRow): string => {
  if (row.source === 'local') {
    const a = row.activity
    if (a.type === 'swap') return swapCopy(a.status, a.toToken.symbol).title
    return moveCopy(a.direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw', a.status).title
  }
  const pending = row.source === 'pending' || row.pending
  return historyRowCopy(row.row, pending ? 'in-progress' : 'completed').title
}
