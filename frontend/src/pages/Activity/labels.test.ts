import { describe, expect, it } from 'vitest'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { historyRowCopy, moveCopy, swapCopy } from './labels'

describe('moveCopy', () => {
  it.each(['deposit', 'withdraw', 'earnDeposit', 'earnWithdraw'] as const)(
    'reads %s in the tense of its status',
    kind => {
      expect(moveCopy(kind, 'completed').title).not.toMatch(/ing\b|failed/)
      expect(moveCopy(kind, 'in-progress').title).toMatch(/ing\b/)
      expect(moveCopy(kind, 'in-progress').subtitle).toMatch(/…$/)
      // The failure reason fills the line under a failed row.
      expect(moveCopy(kind, 'failed')).toEqual({ title: expect.stringMatching(/ failed$/) })
    },
  )
})

describe('swapCopy', () => {
  it('names the asset received', () => {
    expect(swapCopy('completed', 'ETH')).toEqual({ title: 'Swapped for ETH', subtitle: 'No public trace' })
    expect(swapCopy('in-progress', 'ETH').title).toBe('Swapping for ETH')
    expect(swapCopy('failed', 'ETH')).toEqual({ title: 'Swap failed' })
  })

  it('drops the asset when its symbol is unknown', () => {
    expect(swapCopy('completed', '').title).toBe('Swapped')
  })
})

describe('historyRowCopy', () => {
  const row = (kind: ClassifiedHistoryEntry['kind'], entryKind = 'deposit') =>
    ({ kind, counterparty: null, entry: { kind: entryKind } }) as unknown as ClassifiedHistoryEntry

  it('reads history rows as completed', () => {
    expect(historyRowCopy(row('deposit'))).toEqual(moveCopy('deposit', 'completed'))
    expect(historyRowCopy(row('earnWithdraw'))).toEqual(moveCopy('earnWithdraw', 'completed'))
  })

  it('tells a received transfer from a sent one', () => {
    expect(historyRowCopy(row('transfer', 'transferBalanceIn')).title).toBe('Received')
    expect(historyRowCopy(row('transfer', 'transferBalanceOut')).title).toBe('Sent')
  })
})
