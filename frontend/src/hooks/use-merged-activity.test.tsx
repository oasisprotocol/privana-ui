import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import type { EarnPool } from '@/api/earn'
import type { UnsettledOperation } from '@/api/operations'
import type { Activity } from '@/contexts/ActivityProvider/context'
import { useMergedActivity, usePendingActivityCount } from './use-merged-activity'

let historyState: {
  history: HistoryEntry[]
  total: number
  isLoading: boolean
  isError: boolean
  refetch: () => void
}
vi.mock('@oasisprotocol/privana-sdk', () => ({
  useHistory: (opts: { offset: number }) =>
    opts.offset === -1
      ? historyState
      : { history: [], total: 0, isLoading: false, isError: false, refetch: vi.fn() },
}))

let poolsState: { data?: { pools: EarnPool[] }; isLoading: boolean; isError: boolean }
vi.mock('@/api/earn', () => ({ useEarnPools: () => poolsState }))

let tokensState: { data?: { tokens: unknown[] }; isLoading: boolean }
vi.mock('@/api/swap', () => ({ useTokens: () => tokensState }))

let unsettledState: { data?: { operations: UnsettledOperation[] }; isLoading: boolean }
vi.mock('@/api/operations', () => ({ useUnsettledOperations: () => unsettledState }))

let activityState: { activities: Activity[]; removeActivity: (id: string) => void }
vi.mock('@/contexts/ActivityProvider/useActivity', () => ({ useActivity: () => activityState }))

const POOL = { pool_id: '0xeeed', pool_address: '0xPoolAddr', strategy: 'aave' } as EarnPool
const TOKEN_ID = '0xc719'

const histEntry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry =>
  ({
    kind: 'transferBalanceOut',
    timestamp: 5_000,
    token_id: TOKEN_ID,
    amount: '1000000',
    counterparty: POOL.pool_address,
    ...overrides,
  }) as HistoryEntry

const op = (overrides: Partial<UnsettledOperation> = {}): UnsettledOperation => ({
  operation_id: 'srv-1',
  operation_type: 'earn_deposit',
  status: 'pending',
  created_at: 5_000,
  updated_at: 5_010,
  tx_hash: null,
  error: null,
  quote_id: null,
  from_token_id: null,
  to_token_id: null,
  from_amount: null,
  to_amount_estimate: null,
  to_amount_actual: null,
  pool_id: POOL.pool_id,
  token_id: TOKEN_ID,
  amount: '1000000',
  ...overrides,
})

const localEarnActivity = (overrides: Partial<Activity> = {}): Activity =>
  ({
    id: 'tmp-1',
    type: 'earn',
    direction: 'deposit',
    status: 'in-progress',
    createdAt: 5_000_000, // ms
    token: { id: TOKEN_ID, symbol: 'USDC', decimals: 6 },
    amount: '1000000',
    poolId: POOL.pool_id,
    protocol: 'aave',
    ...overrides,
  }) as Activity

beforeEach(() => {
  historyState = { history: [], total: 0, isLoading: false, isError: false, refetch: vi.fn() }
  poolsState = { data: { pools: [POOL] }, isLoading: false, isError: false }
  tokensState = {
    data: { tokens: [{ token_id: TOKEN_ID, token_symbol: 'USDC', token_decimals: 6 }] },
    isLoading: false,
  }
  unsettledState = { data: { operations: [] }, isLoading: false }
  activityState = { activities: [], removeActivity: vi.fn() }
})

describe('useMergedActivity', () => {
  it('renders no rows until every source has loaded', () => {
    historyState.isLoading = true
    unsettledState.data = { operations: [op()] }
    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.rows).toEqual([])
  })

  it('merges chain history, server ops, and optimistic rows newest-first', () => {
    historyState = { ...historyState, history: [histEntry({ kind: 'deposit', timestamp: 1_000 })], total: 1 }
    unsettledState.data = { operations: [op({ status: 'failed', created_at: 2_000 })] }
    activityState.activities = [localEarnActivity({ createdAt: 3_000_000 })]

    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.rows.map(r => [r.source, r.timestamp])).toEqual([
      ['local', 3_000],
      ['local', 2_000],
      ['chain', 1_000],
    ])
  })

  it('shows an undeployed deposit as one in-progress row, not its history copy', () => {
    historyState = { ...historyState, history: [histEntry({ timestamp: 5_000 })], total: 1 }
    unsettledState.data = { operations: [op({ status: 'undeployed', created_at: 5_000 })] }

    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.rows).toHaveLength(1)
    const row = result.current.rows[0]
    expect(row.source).toBe('local')
    if (row.source !== 'local') return
    expect(row.activity.status).toBe('in-progress')
    expect(row.activity.id).toBe('srv-1')
    // Token and pool metadata resolve from the tokens/pools sources.
    if (row.activity.type !== 'earn') return
    expect(row.activity.token.symbol).toBe('USDC')
    expect(row.activity.protocol).toBe('aave')
  })

  it('prunes an optimistic row once the server adopts the operation', () => {
    unsettledState.data = { operations: [op()] }
    activityState.activities = [localEarnActivity({ depositId: 'srv-1' } as Partial<Activity>)]

    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.rows.map(r => (r.source === 'local' ? r.activity.id : null))).toEqual(['srv-1'])
    expect(activityState.removeActivity).toHaveBeenCalledExactlyOnceWith('tmp-1')
  })

  it('prunes a completed optimistic row once its chain entry appears', () => {
    historyState = { ...historyState, history: [histEntry({ timestamp: 5_010 })], total: 1 }
    activityState.activities = [localEarnActivity({ status: 'completed' })]

    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.rows.map(r => r.source)).toEqual(['chain'])
    expect(activityState.removeActivity).toHaveBeenCalledExactlyOnceWith('tmp-1')
  })

  it('refetches history when an operation settles, not on every list refresh', () => {
    unsettledState.data = { operations: [op()] }
    const { rerender } = renderHook(() => useMergedActivity())
    expect(historyState.refetch).not.toHaveBeenCalled()

    // A fresh response object with the same operations is a poll, not a
    // settlement — it must not trigger a history refetch.
    unsettledState = { data: { operations: [op()] }, isLoading: false }
    rerender()
    expect(historyState.refetch).not.toHaveBeenCalled()

    unsettledState = { data: { operations: [] }, isLoading: false }
    rerender()
    expect(historyState.refetch).toHaveBeenCalledOnce()
  })

  it('reports an error when a required source errors', () => {
    historyState.isError = true
    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.isError).toBe(true)
  })
})

describe('usePendingActivityCount', () => {
  it('counts live server ops plus unadopted local activities', () => {
    unsettledState.data = {
      operations: [
        op({ operation_id: 'p1', status: 'pending' }),
        op({ operation_id: 'u1', status: 'undeployed' }),
        op({ operation_id: 'f1', status: 'failed' }),
      ],
    }
    activityState.activities = [
      localEarnActivity({ id: 'tmp-1' }),
      localEarnActivity({ id: 'tmp-2', depositId: 'f1' } as Partial<Activity>),
    ]

    const { result } = renderHook(() => usePendingActivityCount())
    expect(result.current).toBe(3)
  })
})
