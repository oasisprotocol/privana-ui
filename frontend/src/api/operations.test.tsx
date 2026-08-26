import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/query'
import { request } from '@/api/http'
import {
  operationsKeys,
  useUnsettledOperations,
  type UnsettledOperation,
  type UnsettledOperationStatus,
} from '@/api/operations'

vi.mock('@/api/http', () => ({ request: vi.fn() }))

let auth: { session: { address: string } | null; accessToken: string | null }
vi.mock('@oasisprotocol/privana-sdk', () => ({
  useSiweAuth: () => auth,
}))

const ADDRESS = '0x705b2433b76c383C20AE0d60803334f0AD13b6e8'

const op = (status: UnsettledOperationStatus): UnsettledOperation => ({
  operation_id: `op-${status}`,
  operation_type: 'earn_deposit',
  status,
  created_at: 1_000_000,
  updated_at: 1_000_010,
  tx_hash: null,
  error: null,
  quote_id: null,
  from_token_id: null,
  to_token_id: null,
  from_amount: null,
  to_amount_estimate: null,
  to_amount_actual: null,
  pool_id: '0xeeed',
  token_id: '0xc719',
  amount: '1000000',
})

const mockedRequest = vi.mocked(request)

const respondWith = (...operations: UnsettledOperation[]) => mockedRequest.mockResolvedValue({ operations })

describe('useUnsettledOperations', () => {
  beforeEach(() => {
    auth = { session: { address: ADDRESS }, accessToken: 'test-jwt' }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('does not fetch until a session and JWT exist', () => {
    auth = { session: null, accessToken: null }
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useUnsettledOperations(), { wrapper: Wrapper })
    expect(mockedRequest).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  it('fetches the unsettled operations with the session JWT', async () => {
    respondWith(op('failed'))
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useUnsettledOperations(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(mockedRequest).toHaveBeenCalledExactlyOnceWith(
      '/v1/operations/unsettled?limit=100',
      undefined,
      'test-jwt',
    )
    expect(result.current.data?.operations).toHaveLength(1)
  })

  // Under fake timers RTL's waitFor never polls, so the initial fetch is
  // flushed with a zero-length timer advance instead.
  const flushInitialFetch = (result: { current: { data: unknown } }) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(0)
      expect(result.current.data).toBeDefined()
    })

  it.each(['pending', 'undeployed'] as const)('polls every 10s while a %s op exists', async status => {
    vi.useFakeTimers()
    respondWith(op(status))
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useUnsettledOperations(), { wrapper: Wrapper })
    await flushInitialFetch(result)

    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(mockedRequest).toHaveBeenCalledTimes(2)

    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(mockedRequest).toHaveBeenCalledTimes(3)
  })

  it('does not poll when only terminal ops remain', async () => {
    vi.useFakeTimers()
    respondWith(op('failed'), op('canceled'))
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useUnsettledOperations(), { wrapper: Wrapper })
    await flushInitialFetch(result)

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })

  it('drops the cached operations when the JWT disappears', async () => {
    respondWith(op('pending'))
    const { client, Wrapper } = createQueryWrapper()
    const { result, rerender } = renderHook(() => useUnsettledOperations(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(client.getQueryData(operationsKeys.unsettled(ADDRESS))).toBeDefined()

    auth = { session: { address: ADDRESS }, accessToken: null }
    rerender()
    await waitFor(() => expect(client.getQueryData(operationsKeys.unsettled(ADDRESS))).toBeUndefined())
  })
})
