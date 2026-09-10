import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { UnsettledOperation } from '@/api/operations'
import type { Activity } from './context'
import { SwapReconciler } from './SwapReconciler'

let unsettledState: { data?: { operations: UnsettledOperation[] } }
vi.mock('@/api/operations', () => ({ useUnsettledOperations: () => unsettledState }))

let activityState: { activities: Activity[]; updateActivity: ReturnType<typeof vi.fn> }
vi.mock('./useActivity', () => ({ useActivity: () => activityState }))

const swapOp = (overrides: Partial<UnsettledOperation> = {}): UnsettledOperation =>
  ({
    operation_id: 'srv-1',
    operation_type: 'swap',
    status: 'pending',
    created_at: 5_000,
    updated_at: 5_010,
    tx_hash: null,
    error: null,
    quote_id: 'q-1',
    ...overrides,
  }) as UnsettledOperation

const localSwap = (overrides: Partial<Activity> = {}): Activity =>
  ({
    id: 'tmp-1',
    type: 'swap',
    status: 'in-progress',
    createdAt: 5_000_000,
    quoteId: 'q-1',
    fromToken: { id: '0xa', symbol: 'USDC', decimals: 6 },
    toToken: { id: '0xb', symbol: 'ETH', decimals: 18 },
    fromAmount: '1000000',
    toAmount: '1',
    rateLabel: '',
    ...overrides,
  }) as Activity

beforeEach(() => {
  unsettledState = { data: { operations: [] } }
  activityState = { activities: [], updateActivity: vi.fn() }
})

describe('SwapReconciler', () => {
  it('adopts the server row into the local entry', () => {
    unsettledState.data = { operations: [swapOp({ status: 'failed', error: 'boom' })] }
    activityState.activities = [localSwap()]

    render(<SwapReconciler />)
    expect(activityState.updateActivity).toHaveBeenCalledExactlyOnceWith('tmp-1', {
      status: 'failed',
      swapId: 'srv-1',
      txHash: undefined,
      error: 'boom',
    })
  })

  it('marks the entry completed when a previously seen quote leaves the feed', () => {
    activityState.activities = [localSwap()]
    unsettledState.data = { operations: [swapOp({ status: 'pending' })] }
    const view = render(<SwapReconciler />)

    // The row settled: completed rows leave the unsettled feed.
    unsettledState.data = { operations: [] }
    view.rerender(<SwapReconciler />)

    expect(activityState.updateActivity).toHaveBeenLastCalledWith('tmp-1', { status: 'completed' })
  })

  it('leaves a never-observed quote alone', () => {
    activityState.activities = [localSwap()]
    unsettledState.data = { operations: [] }

    render(<SwapReconciler />)
    expect(activityState.updateActivity).not.toHaveBeenCalled()
  })

  it('does not repeat identical patches', () => {
    unsettledState.data = { operations: [swapOp({ status: 'pending' })] }
    activityState.activities = [localSwap({ swapId: 'srv-1' } as Partial<Activity>)]

    render(<SwapReconciler />)
    expect(activityState.updateActivity).not.toHaveBeenCalled()
  })
})
