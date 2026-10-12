import { describe, expect, it } from 'vitest'
import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import type { MergedRow } from '@/hooks/use-merged-activity'
import type { SwapActivity } from '@/contexts/ActivityProvider/context'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { detailsIdOf, findDetailsRow, parseDetailsId } from './details'

const USDC = { id: '0x1', symbol: 'USDC', decimals: 6 }

const chainRow = (
  index: number,
  entry: Partial<HistoryEntry> = {},
): Extract<MergedRow, { source: 'chain' }> => ({
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
    entry: { kind: 'deposit', timestamp: 100, ...entry } as HistoryEntry,
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

const pendingDeposit: MergedRow = {
  source: 'pending',
  timestamp: 1,
  key: 'deposit:0xabc',
  row: chainRow(1).row,
}

describe('detailsIdOf', () => {
  it('names a history entry by its index and an operation by its id', () => {
    expect(detailsIdOf(chainRow(5))).toBe('h-5')
    expect(detailsIdOf(swapRow('abc'))).toBe('op-abc')
  })

  it('names a deposit on its way by its source transaction', () => {
    expect(detailsIdOf(pendingDeposit)).toBe('dep-0xabc')
  })

  it('has none for a swap the server has not answered yet', () => {
    expect(detailsIdOf(swapRow())).toBeNull()
  })
})

describe('parseDetailsId', () => {
  it('reads every kind of id', () => {
    expect(parseDetailsId('op-123e4567')).toEqual({ source: 'operation', operationId: '123e4567' })
    expect(parseDetailsId('h-42')).toEqual({ source: 'history', index: 42 })
    expect(parseDetailsId('dep-0xabc')).toEqual({ source: 'deposit', txHash: '0xabc' })
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

  it('finds a pending deposit, and the history entry it became once credited', () => {
    const ref = { source: 'deposit', txHash: '0xabc' } as const
    expect(findDetailsRow([pendingDeposit, ...rows], ref)).toBe(pendingDeposit)

    const credited = chainRow(8, { deposit_id: '0xd1' })
    const progress = {
      txHash: '0xABC',
      chainId: 8453,
      amount: 1n,
      sentAt: 0,
      stage: 'credited',
      depositId: '0xD1',
    } as const
    expect(findDetailsRow([...rows, credited], ref, progress)).toBe(credited)
    expect(findDetailsRow([...rows, credited], ref, { ...progress, txHash: '0xother' })).toBeUndefined()
  })
})
