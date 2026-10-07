import { describe, expect, it } from 'vitest'
import type { PendingTransfer } from '@/hooks/usePendingTransfers'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { chainRowsWithPending } from './pendingRows'
import { rowKey } from '@/hooks/use-merged-activity'
import { statusOf } from './filters'

const USDC = '0xusdc'
const RECIPIENT = '0xAbC0000000000000000000000000000000000001'

const entry = (index: number, overrides: Partial<ClassifiedHistoryEntry> = {}): ClassifiedHistoryEntry => ({
  source: 'chain',
  kind: 'withdraw',
  index,
  timestamp: 1_000 + index,
  tokenId: USDC,
  amount: '2500000',
  counterparty: RECIPIENT.toLowerCase(),
  pool: undefined,
  entry: { kind: 'withdraw', timestamp: 1_000 + index },
  ...overrides,
})

const pendingWithdrawal = (index: number): PendingTransfer => ({
  kind: 'withdraw',
  key: `withdraw:${index}`,
  amount: '2500000',
  tokenId: USDC,
  token: undefined,
  index,
  to: RECIPIENT,
})

const pendingDeposit = (depositId?: string): PendingTransfer => ({
  kind: 'deposit',
  key: 'deposit:0xabc',
  amount: 10_000_000n,
  tokenId: USDC,
  token: undefined,
  step: 1,
  sentAt: 2_000_500,
  depositId,
})

const pendingIndexes = (rows: ReturnType<typeof chainRowsWithPending>) =>
  rows.flatMap(r => (r.source === 'chain' && r.pending ? [r.row.index] : []))

describe('chainRowsWithPending', () => {
  it('marks the withdrawal row a pending withdrawal came from', () => {
    const rows = chainRowsWithPending([entry(1, { amount: '9' }), entry(2)], [pendingWithdrawal(40)])
    expect(pendingIndexes(rows)).toEqual([2])
    expect(statusOf(rows[1])).toBe('in-progress')
    expect(statusOf(rows[0])).toBe('completed')
  })

  it('matches each pending withdrawal to its own row, newest first', () => {
    const rows = chainRowsWithPending(
      [entry(1), entry(2), entry(3)],
      [pendingWithdrawal(41), pendingWithdrawal(40)],
    )
    expect(pendingIndexes(rows)).toEqual([2, 3])
  })

  it('needs the same token, amount and recipient', () => {
    const rows = chainRowsWithPending(
      [entry(1, { tokenId: '0xeth' }), entry(2, { counterparty: '0xother' }), entry(3, { kind: 'deposit' })],
      [pendingWithdrawal(40)],
    )
    expect(pendingIndexes(rows)).toEqual([])
  })

  it('adds a row of its own for a deposit that has not reached history yet', () => {
    const rows = chainRowsWithPending([entry(1)], [pendingDeposit()])
    const deposit = rows.find(r => r.row.kind === 'deposit')
    expect(deposit).toMatchObject({
      source: 'pending',
      timestamp: 2_000,
      row: { amount: '10000000', tokenId: USDC },
    })
    // It has no history position, so nothing can key it by one.
    expect(deposit?.row).not.toHaveProperty('index')
    expect(statusOf(deposit!)).toBe('in-progress')
    expect(rowKey(deposit!)).toBe('deposit:0xabc')
  })

  it('drops that row once history lists the same deposit', () => {
    const credited = entry(5, {
      kind: 'deposit',
      entry: { kind: 'deposit', timestamp: 2_001, deposit_id: '0xD1' },
    })
    const rows = chainRowsWithPending([credited], [pendingDeposit('0xd1')])
    expect(rows).toHaveLength(1)
    expect(rows[0].source).toBe('chain')
    expect(statusOf(rows[0])).toBe('completed')
  })
})
