import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import type { EarnPool } from '@/api/earn'
import type { Operation } from '@/api/operations'
import type { Activity } from '@/contexts/ActivityProvider/context'
import {
  resolveActivity,
  useMergedActivity,
  usePendingActivityCount,
  useResolvedActivity,
} from './use-merged-activity'

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

let operationsState: {
  data?: { operations: Operation[] }
  isLoading: boolean
  isError?: boolean
  refetch?: () => void
}
vi.mock('@/api/operations', () => ({ useOperations: () => operationsState }))

let activityState: { activities: Activity[] }
vi.mock('@/contexts/ActivityProvider/useActivity', () => ({ useActivity: () => activityState }))

const LP_ADDRESS = '0x00000000000000000000000000000000000000aa'
vi.mock('@/config/swap', () => ({
  isSwapLpAddress: (a: string | null | undefined) => a?.toLowerCase() === LP_ADDRESS,
}))

const TOKEN_ID = '0xc719'
const POOL = {
  pool_id: '0xeeed',
  pool_address: '0xPoolAddr',
  strategy: 'aave',
  token_id: TOKEN_ID,
} as EarnPool

const histEntry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry =>
  ({
    kind: 'transferBalanceOut',
    timestamp: 5_000,
    token_id: TOKEN_ID,
    amount: '1000000',
    counterparty: POOL.pool_address,
    ...overrides,
  }) as HistoryEntry

const op = (overrides: Partial<Operation> = {}): Operation => ({
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
  nonce: null,
  ...overrides,
})

const swapOp = (overrides: Partial<Operation> = {}): Operation =>
  op({
    operation_id: 'srv-swap-1',
    operation_type: 'swap',
    quote_id: 'q-1',
    from_token_id: TOKEN_ID,
    to_token_id: '0xbeef',
    from_amount: '1000000',
    to_amount_estimate: '400000000000000',
    pool_id: null,
    token_id: null,
    amount: null,
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

const localSwapActivity = (overrides: Partial<Activity> = {}): Activity =>
  ({
    id: 'tmp-swap-1',
    type: 'swap',
    status: 'in-progress',
    createdAt: 5_000_000, // ms
    fromToken: { id: TOKEN_ID, symbol: 'USDC', decimals: 6 },
    toToken: { id: '0xbeef', symbol: 'ETH', decimals: 18 },
    fromAmount: '1000000',
    toAmount: '400000000000000',
    rateLabel: '1 USDC = 0.0004 ETH',
    ...overrides,
  }) as Activity

const localIds = (rows: ReturnType<typeof useMergedActivity>['rows']) =>
  rows.map(r => (r.source === 'local' ? r.activity.id : `chain:${r.row.kind}`))

beforeEach(() => {
  historyState = { history: [], total: 0, isLoading: false, isError: false, refetch: vi.fn() }
  poolsState = { data: { pools: [POOL] }, isLoading: false, isError: false }
  tokensState = {
    data: { tokens: [{ token_id: TOKEN_ID, token_symbol: 'USDC', token_decimals: 6 }] },
    isLoading: false,
  }
  operationsState = { data: { operations: [] }, isLoading: false }
  activityState = { activities: [] }
})

describe('useMergedActivity', () => {
  it('renders no rows until every source has loaded', () => {
    historyState.isLoading = true
    operationsState.data = { operations: [op()] }
    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.rows).toEqual([])
  })

  it('merges chain history, server ops, and optimistic rows newest-first', () => {
    historyState = { ...historyState, history: [histEntry({ kind: 'deposit', timestamp: 1_000 })], total: 1 }
    operationsState.data = { operations: [op({ status: 'completed', created_at: 2_000 })] }
    activityState.activities = [localEarnActivity({ createdAt: 3_000_000 })]

    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.rows.map(r => [r.source, r.timestamp])).toEqual([
      ['local', 3_000],
      ['local', 2_000],
      ['chain', 1_000],
    ])
  })

  it("takes a scheduled operation's token from its pool while the row has none", () => {
    operationsState.data = { operations: [op({ status: 'scheduled', token_id: '' })] }

    const { result } = renderHook(() => useMergedActivity())
    const row = result.current.rows[0]
    expect(row.source).toBe('local')
    expect(row.source === 'local' && row.activity.type === 'earn' && row.activity.token.symbol).toBe('USDC')
  })

  it('renders swaps and earn moves from the server, never from their history legs', () => {
    historyState = {
      ...historyState,
      history: [
        histEntry({ timestamp: 5_000 }), // earn deposit leg
        histEntry({ counterparty: LP_ADDRESS, timestamp: 6_000 }), // swap out leg
        histEntry({
          kind: 'transferBalanceIn',
          counterparty: LP_ADDRESS,
          token_id: '0xbeef',
          timestamp: 6_000,
        }),
        histEntry({ kind: 'deposit', counterparty: null, timestamp: 7_000 }),
      ],
      total: 4,
    }
    operationsState.data = {
      operations: [
        op({ status: 'completed', created_at: 5_000 }),
        swapOp({ status: 'completed', created_at: 6_000 }),
      ],
    }

    const { result } = renderHook(() => useMergedActivity())
    expect(localIds(result.current.rows)).toEqual(['chain:deposit', 'srv-swap-1', 'srv-1'])
    const earn = result.current.rows[2]
    if (earn.source !== 'local' || earn.activity.type !== 'earn') throw new Error('expected earn row')
    expect(earn.activity.status).toBe('completed')
    expect(earn.activity.token.symbol).toBe('USDC')
    expect(earn.activity.protocol).toBe('aave')
  })

  it('hides a local entry once the server lists its operation id', () => {
    operationsState.data = { operations: [op()] }
    activityState.activities = [localEarnActivity({ depositId: 'srv-1' } as Partial<Activity>)]

    const { result } = renderHook(() => useMergedActivity())
    expect(localIds(result.current.rows)).toEqual(['srv-1'])
  })

  it('hides a timed-out swap by quote id once the server row appears', () => {
    // The execute response never arrived: the local entry has a quoteId but no swapId.
    operationsState.data = { operations: [swapOp()] }
    activityState.activities = [localSwapActivity({ quoteId: 'q-1' } as Partial<Activity>)]

    const { result } = renderHook(() => useMergedActivity())
    expect(localIds(result.current.rows)).toEqual(['srv-swap-1'])
  })

  it('hides an earn entry whose response was lost once the server row with its nonce appears', () => {
    operationsState.data = { operations: [op({ nonce: '7' })] }
    activityState.activities = [localEarnActivity({ nonce: '7' } as Partial<Activity>)]

    const { result } = renderHook(() => useMergedActivity())
    expect(localIds(result.current.rows)).toEqual(['srv-1'])
  })

  it('does not match an earn entry on nonce across directions', () => {
    operationsState.data = { operations: [op({ operation_type: 'earn_withdraw', nonce: '7' })] }
    activityState.activities = [localEarnActivity({ nonce: '7' } as Partial<Activity>)]

    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.rows).toHaveLength(2)
  })

  it('matches an earn entry on pool, amount and nonce, newest row first', () => {
    // A refused request left nonce 7 unspent; the retry reused it.
    operationsState.data = {
      operations: [
        op({ operation_id: 'old-failed', status: 'failed', nonce: '7', created_at: 4_000 }),
        op({ operation_id: 'retry', status: 'pending', nonce: '7', created_at: 5_000 }),
        op({ operation_id: 'other-amount', status: 'pending', nonce: '7', amount: '5', created_at: 6_000 }),
      ],
    }
    const local = localEarnActivity({ nonce: '7' } as Partial<Activity>)
    const resolved = resolveActivity(local, operationsState.data.operations)
    expect(resolved.type === 'earn' && resolved.depositId).toBe('retry')
  })

  it('reports an error and no rows when the operations feed fails', () => {
    operationsState = { data: undefined, isLoading: false, isError: true }
    historyState = { ...historyState, history: [histEntry({ kind: 'deposit' })], total: 1 }

    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.isError).toBe(true)
    expect(result.current.rows).toEqual([])
  })

  it('keeps a local swap whose quote the server does not know', () => {
    operationsState.data = { operations: [swapOp({ quote_id: 'q-other' })] }
    activityState.activities = [localSwapActivity({ quoteId: 'q-1' } as Partial<Activity>)]

    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.rows).toHaveLength(2)
  })

  it('reports an error when a required source errors', () => {
    historyState.isError = true
    const { result } = renderHook(() => useMergedActivity())
    expect(result.current.isError).toBe(true)
  })
})

describe('resolveActivity', () => {
  it('lays the server outcome over the local entry and keeps client-only labels', () => {
    const local = localSwapActivity({ quoteId: 'q-1' } as Partial<Activity>)
    const resolved = resolveActivity(local, [
      swapOp({ status: 'completed', tx_hash: '0xtx', to_amount_actual: '390000000000000' }),
    ])
    expect(resolved).toMatchObject({
      id: 'tmp-swap-1',
      status: 'completed',
      swapId: 'srv-swap-1',
      txHash: '0xtx',
      toAmount: '390000000000000',
      rateLabel: '1 USDC = 0.0004 ETH',
    })
  })

  it('marks a failed operation with its error', () => {
    const local = localEarnActivity({ depositId: 'srv-1' } as Partial<Activity>)
    const resolved = resolveActivity(local, [op({ status: 'failed', error: 'InsufficientBalance' })])
    expect(resolved).toMatchObject({ status: 'failed', error: 'InsufficientBalance' })
  })

  it('returns the local entry untouched while the server has no row', () => {
    const local = localEarnActivity()
    expect(resolveActivity(local, [])).toBe(local)
  })
})

describe('useResolvedActivity', () => {
  it('follows the local entry by id and applies the server row once listed', () => {
    activityState.activities = [localEarnActivity({ depositId: 'srv-1' } as Partial<Activity>)]
    const { result, rerender } = renderHook(() => useResolvedActivity('tmp-1'))
    expect(result.current?.status).toBe('in-progress')

    operationsState = { data: { operations: [op({ status: 'completed' })] }, isLoading: false }
    rerender()
    expect(result.current?.status).toBe('completed')
  })
})

describe('usePendingActivityCount', () => {
  it('counts in-flight server ops plus unlisted local activities', () => {
    operationsState.data = {
      operations: [
        op({ operation_id: 'p1', status: 'pending' }),
        op({ operation_id: 'u1', status: 'undeployed' }),
        op({ operation_id: 'f1', status: 'failed' }),
        op({ operation_id: 'c1', status: 'completed' }),
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
