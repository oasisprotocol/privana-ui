import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { Operation, OperationStatus } from '@/api/operations'
import { useResetOnSettle } from './use-reset-on-settle'

let operationsState: { data?: { operations: Operation[] } }
vi.mock('@/api/operations', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api/operations')>()),
  useOperations: () => operationsState,
}))

const reset = vi.fn()
vi.mock('./use-reset-balance-caches', () => ({ useResetBalanceCaches: () => reset }))

const NOW = 1_800_000_000

const op = (operation_id: string, status: OperationStatus, created_at = NOW - 3_600): Operation => ({
  operation_id,
  operation_type: 'earn_deposit',
  status,
  created_at,
  updated_at: created_at,
  tx_hash: null,
  error: null,
  quote_id: null,
  from_token_id: null,
  to_token_id: null,
  from_amount: null,
  to_amount_estimate: null,
  to_amount_actual: null,
  pool_id: '0xpool',
  token_id: '0xusdc',
  amount: '1000000',
  nonce: null,
})

// Each poll hands the hook a fresh response object, as React Query does.
const poll = (rerender: () => void, ...operations: Operation[]) => {
  operationsState = { data: { operations } }
  rerender()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW * 1000)
  operationsState = {}
  reset.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useResetOnSettle', () => {
  it('does nothing before the feed has loaded', () => {
    renderHook(() => useResetOnSettle([]))
    expect(reset).not.toHaveBeenCalled()
  })

  it('treats the first response as already reflected, settled or not', () => {
    const { rerender } = renderHook(() => useResetOnSettle([]))
    poll(rerender, op('done', 'completed'), op('open', 'scheduled'))
    expect(reset).not.toHaveBeenCalled()
  })

  it('resets once when an in-flight operation completes, not on later polls', () => {
    const { rerender } = renderHook(() => useResetOnSettle([]))
    poll(rerender, op('a', 'scheduled'))
    poll(rerender, op('a', 'executing'))
    expect(reset).not.toHaveBeenCalled()

    poll(rerender, op('a', 'completed'))
    expect(reset).toHaveBeenCalledTimes(1)

    poll(rerender, op('a', 'completed'))
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it.each(['failed', 'refunded', 'canceled'] as const)('resets when an operation ends %s', status => {
    const { rerender } = renderHook(() => useResetOnSettle([]))
    poll(rerender, op('a', 'pending'))
    poll(rerender, op('a', status))
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('resets once for several operations settling in the same poll', () => {
    const { rerender } = renderHook(() => useResetOnSettle([]))
    poll(rerender, op('a', 'scheduled'), op('b', 'scheduled'))
    poll(rerender, op('a', 'completed'), op('b', 'failed'))
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('counts an operation that started after watching began and was first seen settled', () => {
    // A quick swap can finish between two polls and never show as in flight.
    const { rerender } = renderHook(() => useResetOnSettle([]))
    poll(rerender, op('old', 'completed'))
    poll(rerender, op('old', 'completed'), op('quick', 'completed', NOW + 5))
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('ignores settled operations that predate watching when they first appear', () => {
    // e.g. another account's history after a switch, or an older page.
    const { rerender } = renderHook(() => useResetOnSettle([]))
    poll(rerender, op('mine', 'completed'))
    poll(rerender, op('theirs', 'completed', NOW - 86_400))
    expect(reset).not.toHaveBeenCalled()
  })
})
