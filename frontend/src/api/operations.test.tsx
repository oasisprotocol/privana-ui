import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/query'
import { signInAs, siweAuth } from '@/test/siwe'
import { request } from '@/api/http'
import { operationsKeys, useOperations, type Operation, type OperationStatus } from '@/api/operations'

vi.mock('@/api/http', () => ({ request: vi.fn() }))

vi.mock('@oasisprotocol/privana-sdk', () => ({ useSiweAuth: () => siweAuth.state }))

const ADDRESS = '0x705b2433b76c383C20AE0d60803334f0AD13b6e8'

const op = (status: OperationStatus): Operation => ({
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
  nonce: null,
})

const mockedRequest = vi.mocked(request)

const respondWith = (...operations: Operation[]) =>
  mockedRequest.mockResolvedValue({ operations, next_cursor: null })

describe('useOperations', () => {
  beforeEach(() => {
    signInAs(ADDRESS)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('does not fetch until a session and JWT exist', () => {
    siweAuth.state = { session: null, accessToken: null }
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useOperations(), { wrapper: Wrapper })
    expect(mockedRequest).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  it('fetches the newest operations page with the session JWT', async () => {
    respondWith(op('failed'))
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useOperations(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(mockedRequest).toHaveBeenCalledExactlyOnceWith('/v1/operations?limit=100', undefined, 'test-jwt')
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
    const { result } = renderHook(() => useOperations(), { wrapper: Wrapper })
    await flushInitialFetch(result)

    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(mockedRequest).toHaveBeenCalledTimes(2)

    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(mockedRequest).toHaveBeenCalledTimes(3)
  })

  it('does not poll when only settled ops remain', async () => {
    vi.useFakeTimers()
    respondWith(op('failed'), op('canceled'), op('completed'))
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useOperations(), { wrapper: Wrapper })
    await flushInitialFetch(result)

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })

  it('drops the cached operations when the JWT disappears', async () => {
    respondWith(op('pending'))
    const { client, Wrapper } = createQueryWrapper()
    const { result, rerender } = renderHook(() => useOperations(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(client.getQueryData(operationsKeys.list(ADDRESS))).toBeDefined()

    siweAuth.state = { session: { address: ADDRESS }, accessToken: null }
    rerender()
    await waitFor(() => expect(client.getQueryData(operationsKeys.list(ADDRESS))).toBeUndefined())
  })
})
