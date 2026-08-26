import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/query'
import { signInAs, siweAuth } from '@/test/siwe'
import { ApiError, request } from '@/api/http'
import { usePortfolioHistory, type PortfolioHistoryResponse } from '@/api/portfolio'

vi.mock('@/api/http', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api/http')>()),
  request: vi.fn(),
}))

vi.mock('@oasisprotocol/privana-sdk', () => ({ useSiweAuth: () => siweAuth.state }))

const ADDRESS = '0x705b2433b76c383C20AE0d60803334f0AD13b6e8'
const OTHER_ADDRESS = '0x152E6a7125665764a4F1F1df80E8f5D49Bf0239c'

const mockedRequest = vi.mocked(request)

const response = (totalUsd: string): PortfolioHistoryResponse => ({
  points: [{ timestamp: 1_000_000, total_usd: totalUsd, available_usd: '0', locked_usd: '0', earn_usd: '0' }],
})

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => {
    resolve = r
  })
  return { promise, resolve }
}

describe('usePortfolioHistory', () => {
  beforeEach(() => {
    signInAs(ADDRESS)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('does not retry 4xx answers', async () => {
    mockedRequest.mockRejectedValue(new ApiError(404, 'not deployed'))
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => usePortfolioHistory(7), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })

  it('keeps the previous range as placeholder while the next one loads', async () => {
    mockedRequest.mockResolvedValueOnce(response('week'))
    const next = deferred<PortfolioHistoryResponse>()
    const { Wrapper } = createQueryWrapper()
    const { result, rerender } = renderHook(({ days }) => usePortfolioHistory(days), {
      wrapper: Wrapper,
      initialProps: { days: 7 },
    })
    await waitFor(() => expect(result.current.data).toBeDefined())

    mockedRequest.mockReturnValueOnce(next.promise)
    rerender({ days: 30 })
    expect(result.current.data?.points[0].total_usd).toBe('week')
    expect(result.current.isPlaceholderData).toBe(true)

    next.resolve(response('month'))
    await waitFor(() => expect(result.current.data?.points[0].total_usd).toBe('month'))
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it("never shows the previous user's chart after an address switch", async () => {
    mockedRequest.mockResolvedValueOnce(response('user-a'))
    const { Wrapper } = createQueryWrapper()
    const { result, rerender } = renderHook(() => usePortfolioHistory(7), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())

    mockedRequest.mockReturnValueOnce(deferred<PortfolioHistoryResponse>().promise)
    signInAs(OTHER_ADDRESS, 'other-jwt')
    rerender()
    // The switch starts a fresh fetch under the new session…
    expect(mockedRequest).toHaveBeenCalledTimes(2)
    expect(mockedRequest).toHaveBeenLastCalledWith('/v1/portfolio/history?days=7', undefined, 'other-jwt')
    // …and the old user's data is not shown while it loads.
    expect(result.current.data).toBeUndefined()
  })
})
