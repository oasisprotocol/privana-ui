import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { Operation, OperationStatus } from '@/api/operations'
import { useRefreshOnSettle } from './use-refresh-on-settle'

let operationsState: { data?: { operations: Operation[] } }
vi.mock('@/api/operations', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api/operations')>()),
  useOperations: () => operationsState,
}))

const refresh = vi.fn()
vi.mock('./use-reset-balance-caches', () => ({ useRefreshBalanceCaches: () => refresh }))

const NOW = 1_800_000_000

const op = (
  operation_id: string,
  status: OperationStatus,
  created_at = NOW - 3_600,
  updated_at = created_at,
): Operation => ({
  operation_id,
  operation_type: 'earn_deposit',
  status,
  created_at,
  updated_at,
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
  refresh.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useRefreshOnSettle', () => {
  it('does nothing before the feed has loaded', () => {
    renderHook(() => useRefreshOnSettle([]))
    expect(refresh).not.toHaveBeenCalled()
  })

  it('ignores a first response whose operations settled before watching began', () => {
    const { rerender } = renderHook(() => useRefreshOnSettle([]))
    poll(rerender, op('done', 'completed'), op('open', 'scheduled'))
    expect(refresh).not.toHaveBeenCalled()
  })

  it('refreshes when the first response has an operation that settled after watching began', () => {
    // Balances loaded while it was still in flight, but the feed only answered after it settled.
    const { rerender } = renderHook(() => useRefreshOnSettle([]))
    vi.setSystemTime((NOW + 30) * 1000)
    poll(rerender, op('a', 'completed', NOW - 600, NOW + 20))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('refreshes once when an in-flight operation completes, not on later polls', () => {
    const { rerender } = renderHook(() => useRefreshOnSettle([]))
    poll(rerender, op('a', 'scheduled'))
    poll(rerender, op('a', 'executing'))
    expect(refresh).not.toHaveBeenCalled()

    poll(rerender, op('a', 'completed'))
    expect(refresh).toHaveBeenCalledTimes(1)

    poll(rerender, op('a', 'completed'))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it.each(['failed', 'refunded', 'canceled'] as const)('refreshes when an operation ends %s', status => {
    const { rerender } = renderHook(() => useRefreshOnSettle([]))
    poll(rerender, op('a', 'pending'))
    poll(rerender, op('a', status))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('refreshes once when an earn deposit parks as undeployed, not again when it completes', () => {
    const { rerender } = renderHook(() => useRefreshOnSettle([]))
    poll(rerender, op('a', 'pending'))
    poll(rerender, op('a', 'undeployed'))
    expect(refresh).toHaveBeenCalledTimes(1)

    poll(rerender, op('a', 'undeployed'))
    poll(rerender, op('a', 'completed'))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('refreshes once for several operations settling in the same poll', () => {
    const { rerender } = renderHook(() => useRefreshOnSettle([]))
    poll(rerender, op('a', 'scheduled'), op('b', 'scheduled'))
    poll(rerender, op('a', 'completed'), op('b', 'failed'))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('counts an operation that started after watching began and was first seen settled', () => {
    // A quick swap can finish between two polls and never show as in flight.
    const { rerender } = renderHook(() => useRefreshOnSettle([]))
    poll(rerender, op('old', 'completed'))
    poll(rerender, op('old', 'completed'), op('quick', 'completed', NOW + 5))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('ignores settled operations that predate watching when they first appear', () => {
    // e.g. another account's history after a switch, or an older page.
    const { rerender } = renderHook(() => useRefreshOnSettle([]))
    poll(rerender, op('mine', 'completed'))
    poll(rerender, op('theirs', 'completed', NOW - 86_400))
    expect(refresh).not.toHaveBeenCalled()
  })
})
