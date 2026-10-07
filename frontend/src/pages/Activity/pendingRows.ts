import type { MergedRow } from '@/hooks/use-merged-activity'
import type { PendingTransfer } from '@/hooks/usePendingTransfers'
import type { ClassifiedHistoryEntry } from './historyMapping'

export type HistoryRow = Extract<MergedRow, { source: 'chain' | 'pending' }>

const same = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase()

/**
 * History rows with the pending transfers folded in. A withdrawal is in history
 * from the moment it is requested, so its row is marked pending until it pays
 * out. A deposit reaches history only once credited, so until then it gets a row
 * of its own, dropped as soon as history lists the same deposit.
 */
export function chainRowsWithPending(
  entries: readonly ClassifiedHistoryEntry[],
  transfers: readonly PendingTransfer[],
): HistoryRow[] {
  // History has no withdrawal index, so token, amount and recipient identify the
  // request, newest first. Two identical pending withdrawals are both pending anyway.
  const newestFirst = [...entries].sort((a, b) => b.timestamp - a.timestamp || b.index - a.index)
  const pendingIndexes = new Set<number>()
  for (const t of transfers) {
    if (t.kind !== 'withdraw') continue
    const match = newestFirst.find(
      e =>
        e.kind === 'withdraw' &&
        !pendingIndexes.has(e.index) &&
        same(e.tokenId, t.tokenId) &&
        e.amount === t.amount &&
        same(e.counterparty, t.to),
    )
    if (match) pendingIndexes.add(match.index)
  }

  const rows: HistoryRow[] = entries.map(row => ({
    source: 'chain',
    timestamp: row.timestamp,
    row,
    ...(pendingIndexes.has(row.index) && { pending: true }),
  }))

  for (const t of transfers) {
    if (t.kind !== 'deposit') continue
    if (t.depositId && entries.some(e => same(e.entry.deposit_id, t.depositId))) continue
    const timestamp = Math.floor(t.sentAt / 1000)
    const amount = t.amount.toString()
    rows.push({
      source: 'pending',
      timestamp,
      key: t.key,
      row: {
        kind: 'deposit',
        timestamp,
        tokenId: t.tokenId ?? null,
        amount,
        counterparty: null,
        pool: undefined,
        entry: { kind: 'deposit', timestamp, token_id: t.tokenId, amount },
      },
    })
  }
  return rows
}
