import { describe, expect, it } from 'vitest'
import type { MergedRow } from '@/hooks/use-merged-activity'
import type { SwapActivity } from '@/contexts/ActivityProvider/context'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { detailsIdOf, findDetailsRow, parseDetailsId } from './details'

const USDC = { id: '0x1', symbol: 'USDC', decimals: 6 }

const chainRow = (index: number): Extract<MergedRow, { source: 'chain' }> => ({
  source: 'chain',
  timestamp: 100,
  row: {
    source: 'chain',
    kind: 'deposit',
    index,
    timestamp: 100,
    tokenId: '0x1',
    amount: '1000000',
    counterparty: null,
    pool: undefined,
    entry: { kind: 'deposit', timestamp: 100 },
  } as ClassifiedHistoryEntry,
})

const swapRow = (swapId?: string): MergedRow => ({
  source: 'local',
  timestamp: 100,
  activity: {
    id: swapId ?? 'local-uuid',
    type: 'swap',
    status: 'in-progress',
    createdAt: 100_000,
    fromToken: USDC,
    toToken: USDC,
    fromAmount: '1',
    toAmount: '1',
    swapId,
  } satisfies SwapActivity,
})

describe('detailsIdOf', () => {
  it('names a history entry by its index and an operation by its id', () => {
    expect(detailsIdOf(chainRow(5))).toBe('h-5')
    expect(detailsIdOf(swapRow('abc'))).toBe('op-abc')
  })

  it('has none for a swap the server has not answered yet, or a deposit on its way', () => {
    expect(detailsIdOf(swapRow())).toBeNull()
    expect(
      detailsIdOf({
        source: 'pending',
        timestamp: 1,
        key: 'deposit:0xabc',
        row: chainRow(1).row,
      } as MergedRow),
    ).toBeNull()
  })
})

describe('parseDetailsId', () => {
  it('reads both kinds of id', () => {
    expect(parseDetailsId('op-123e4567')).toEqual({ source: 'operation', operationId: '123e4567' })
    expect(parseDetailsId('h-42')).toEqual({ source: 'history', index: 42 })
  })

  it('rejects anything else', () => {
    expect(parseDetailsId('op-')).toBeNull()
    expect(parseDetailsId('h-x')).toBeNull()
    expect(parseDetailsId('42')).toBeNull()
  })
})

describe('findDetailsRow', () => {
  const rows = [chainRow(3), swapRow('abc'), chainRow(7)]

  it('finds the row an id points at', () => {
    expect(findDetailsRow(rows, { source: 'history', index: 7 })).toBe(rows[2])
    expect(findDetailsRow(rows, { source: 'operation', operationId: 'abc' })).toBe(rows[1])
  })

  it('finds nothing for an id that is not loaded', () => {
    expect(findDetailsRow(rows, { source: 'history', index: 99 })).toBeUndefined()
  })
})
