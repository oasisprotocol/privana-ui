import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { UnsettledOperation } from '@/api/operations'
import type { Activity } from './context'
import { EarnReconciler } from './EarnReconciler'

let unsettledState: { data?: { operations: UnsettledOperation[] } }
vi.mock('@/api/operations', () => ({ useUnsettledOperations: () => unsettledState }))

let activityState: { activities: Activity[]; updateActivity: ReturnType<typeof vi.fn> }
vi.mock('./useActivity', () => ({ useActivity: () => activityState }))

const earnOp = (overrides: Partial<UnsettledOperation> = {}): UnsettledOperation =>
  ({
    operation_id: 'srv-1',
    operation_type: 'earn_deposit',
    status: 'pending',
    created_at: 5_000,
    updated_at: 5_010,
    tx_hash: null,
    error: null,
    quote_id: null,
    pool_id: 'pool-1',
    token_id: '0xa',
    amount: '1000000',
    ...overrides,
  }) as UnsettledOperation

const localEarn = (overrides: Partial<Activity> = {}): Activity =>
  ({
    id: 'tmp-1',
    type: 'earn',
    direction: 'deposit',
    status: 'in-progress',
    createdAt: 5_000_000,
    token: { id: '0xa', symbol: 'USDC', decimals: 6 },
    amount: '1000000',
    poolId: 'pool-1',
    protocol: 'Aave',
    ...overrides,
  }) as Activity

beforeEach(() => {
  unsettledState = { data: { operations: [] } }
  activityState = { activities: [], updateActivity: vi.fn() }
})

describe('EarnReconciler', () => {
  it('adopts the server row into the local entry', () => {
    unsettledState.data = { operations: [earnOp({ status: 'failed', error: 'boom' })] }
    activityState.activities = [localEarn()]

    render(<EarnReconciler />)

    expect(activityState.updateActivity).toHaveBeenCalledExactlyOnceWith('tmp-1', {
      status: 'failed',
      depositId: 'srv-1',
      txHash: undefined,
      error: 'boom',
    })
  })

  it('marks the entry completed once a previously listed op leaves the feed', () => {
    unsettledState.data = { operations: [earnOp()] }
    activityState.activities = [localEarn()]
    const { rerender } = render(<EarnReconciler />)

    unsettledState.data = { operations: [] }
    activityState.updateActivity.mockClear()
    rerender(<EarnReconciler />)

    expect(activityState.updateActivity).toHaveBeenCalledExactlyOnceWith('tmp-1', {
      status: 'completed',
    })
  })

  it('leaves a settled entry alone when a later identical op is listed', () => {
    // Pool, token and amount do not identify an operation. A second deposit of
    // the same size must not drag the first one back to in-progress.
    unsettledState.data = { operations: [earnOp({ operation_id: 'srv-2', created_at: 5_200 })] }
    activityState.activities = [
      localEarn({ id: 'done-1', status: 'completed', depositId: 'srv-1' }),
      localEarn({ id: 'tmp-2', createdAt: 5_100_000 }),
    ]

    render(<EarnReconciler />)

    expect(activityState.updateActivity).toHaveBeenCalledExactlyOnceWith('tmp-2', {
      status: 'in-progress',
      depositId: 'srv-2',
      txHash: undefined,
      error: undefined,
    })
  })

  it('pairs one op to one entry rather than resolving both with the same row', () => {
    // Both entries are inside the op's skew window, so only the pairing rule
    // stops the second one binding to the same row.
    unsettledState.data = { operations: [earnOp({ operation_id: 'srv-1', created_at: 5_200 })] }
    activityState.activities = [localEarn({ id: 'a' }), localEarn({ id: 'b', createdAt: 5_100_000 })]

    render(<EarnReconciler />)

    // Only the older entry binds; the younger one has no row of its own yet.
    expect(activityState.updateActivity).toHaveBeenCalledExactlyOnceWith('a', {
      status: 'in-progress',
      depositId: 'srv-1',
      txHash: undefined,
      error: undefined,
    })
  })

  it('adopts a queued row that has not resolved its token yet', () => {
    // A scheduled operation is recorded before anything reads the pool, so the
    // feed carries no token for it. Matching must not depend on one.
    unsettledState.data = { operations: [earnOp({ status: 'scheduled', token_id: '' })] }
    activityState.activities = [localEarn()]

    render(<EarnReconciler />)

    expect(activityState.updateActivity).toHaveBeenCalledExactlyOnceWith('tmp-1', {
      status: 'in-progress',
      depositId: 'srv-1',
      txHash: undefined,
      error: undefined,
    })
  })

  it('ignores a withdraw row when the local entry is a deposit', () => {
    unsettledState.data = { operations: [earnOp({ operation_type: 'earn_withdraw' })] }
    activityState.activities = [localEarn()]

    render(<EarnReconciler />)

    expect(activityState.updateActivity).not.toHaveBeenCalled()
  })
})
