import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { EarnBalance, EarnPool } from '@/api/earn'
import { useActiveStrategies } from './useActiveStrategies'

let balanceState: { data?: { positions: EarnBalance[] }; isLoading: boolean }
let poolsState: { data?: { pools: EarnPool[] }; isLoading: boolean }
vi.mock('@/api/earn', () => ({
  useEarnBalance: () => balanceState,
  useEarnPools: () => poolsState,
}))

let tokensState: { data?: { tokens: unknown[] }; isLoading: boolean }
vi.mock('@/api/swap', () => ({ useTokens: () => tokensState }))

const pool = (overrides: Partial<EarnPool> = {}): EarnPool =>
  ({
    pool_id: '0xpool-a',
    token_id: '0xusdc',
    strategy: 'aave',
    total_assets: '0',
    apy_bps: 1200,
    status: 'active',
    pool_address: '0xPoolAddr',
    ...overrides,
  }) as EarnPool

const position = (overrides: Partial<EarnBalance> = {}): EarnBalance => ({
  pool_id: '0xpool-a',
  token_id: '0xusdc',
  shares: '1000000',
  underlying_amount: '1008000',
  exchange_rate: '1.008',
  change_24h: null,
  change_24h_pct: null,
  earned_active: '8000',
  earned_active_status: 'ok',
  cost_basis: '1000000',
  deposit_count: 1,
  first_deposit_at: 1_000_000,
  ...overrides,
})

beforeEach(() => {
  balanceState = { data: { positions: [] }, isLoading: false }
  poolsState = { data: { pools: [pool()] }, isLoading: false }
  tokensState = {
    data: { tokens: [{ token_id: '0xusdc', token_symbol: 'USDC', token_decimals: 6 }] },
    isLoading: false,
  }
})

describe('useActiveStrategies earned', () => {
  it('aggregates earned per symbol across pools of the same token', () => {
    poolsState.data = { pools: [pool(), pool({ pool_id: '0xpool-b' })] }
    balanceState.data = {
      positions: [position(), position({ pool_id: '0xpool-b', earned_active: '2000' })],
    }
    const { result } = renderHook(() => useActiveStrategies())
    expect(result.current.earned).toEqual([{ symbol: 'USDC', amount: 10_000n, decimals: 6 }])
  })

  it('is null when any active position lacks an ok earned figure', () => {
    poolsState.data = { pools: [pool(), pool({ pool_id: '0xpool-b' })] }
    balanceState.data = {
      positions: [
        position(),
        position({ pool_id: '0xpool-b', earned_active: null, earned_active_status: 'ledger_incomplete' }),
      ],
    }
    const { result } = renderHook(() => useActiveStrategies())
    expect(result.current.earned).toBeNull()
  })

  it('ignores exited (zero-share) positions when deciding whether earned is known', () => {
    balanceState.data = {
      positions: [
        position(),
        position({
          shares: '0',
          underlying_amount: '0',
          earned_active: null,
          earned_active_status: 'pending_settlement',
        }),
      ],
    }
    const { result } = renderHook(() => useActiveStrategies())
    expect(result.current.earned).toEqual([{ symbol: 'USDC', amount: 8_000n, decimals: 6 }])
  })

  it('keeps a negative earned figure signed', () => {
    balanceState.data = { positions: [position({ earned_active: '-500' })] }
    const { result } = renderHook(() => useActiveStrategies())
    expect(result.current.earned).toEqual([{ symbol: 'USDC', amount: -500n, decimals: 6 }])
  })

  it('aligns same-symbol tokens with different decimals to the larger precision', () => {
    poolsState.data = { pools: [pool(), pool({ pool_id: '0xpool-b', token_id: '0xusdc8' })] }
    tokensState.data = {
      tokens: [
        { token_id: '0xusdc', token_symbol: 'USDC', token_decimals: 6 },
        { token_id: '0xusdc8', token_symbol: 'USDC', token_decimals: 8 },
      ],
    }
    balanceState.data = {
      positions: [position(), position({ pool_id: '0xpool-b', token_id: '0xusdc8', earned_active: '100' })],
    }
    const { result } = renderHook(() => useActiveStrategies())
    // 8000 at 6 decimals is 800000 at 8; plus 100 at 8 decimals.
    expect(result.current.earned).toEqual([{ symbol: 'USDC', amount: 800_100n, decimals: 8 }])
  })

  it('is an empty list, not null, with no active positions', () => {
    const { result } = renderHook(() => useActiveStrategies())
    expect(result.current.earned).toEqual([])
  })
})

describe('useActiveStrategies projected', () => {
  it('projects monthly rewards from the position and pool APY', () => {
    balanceState.data = { positions: [position({ underlying_amount: '1200000' })] }
    const { result } = renderHook(() => useActiveStrategies())
    // 1200000 × 1200bps / 12 months = 12000 base units.
    expect(result.current.projectedMonthly).toEqual([{ symbol: 'USDC', amount: 12_000n, decimals: 6 }])
  })
})
