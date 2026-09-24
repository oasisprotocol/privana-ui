import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/query'
import { signInAs, siweAuth } from '@/test/siwe'
import { ApiError, request } from '@/api/http'
import {
  endSeriesAt,
  sliceRange,
  usePortfolioChart,
  usePortfolioHistory,
  type PortfolioHistoryResponse,
} from '@/api/portfolio'

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

const DAY = 86_400
const NOW = 1_800_000_000
const point = (timestamp: number, total = '1') => ({
  timestamp,
  total_usd: total,
  available_usd: '0',
  locked_usd: '0',
  earn_usd: '0',
})

describe('sliceRange', () => {
  // 6 h grid over 10 days, closed on "now".
  const series = [...Array.from({ length: 40 }, (_, i) => point(NOW - 10 * DAY + i * (DAY / 4))), point(NOW)]

  it('keeps the points inside the range plus the sample before the cutoff', () => {
    const day = sliceRange(series, 'day')
    expect(day[0].timestamp).toBeLessThan(NOW - DAY)
    expect(day[1].timestamp).toBeGreaterThanOrEqual(NOW - DAY)
    expect(day[day.length - 1].timestamp).toBe(NOW)
  })

  it('measures the range from the series end, not the wall clock', () => {
    const week = sliceRange(series, 'week')
    expect(week[1].timestamp).toBeGreaterThanOrEqual(NOW - 7 * DAY)
    expect(week.length).toBeLessThan(series.length)
  })

  it('returns everything for "all" and for a range wider than the series', () => {
    expect(sliceRange(series, 'all')).toEqual(series)
    expect(sliceRange(series, 'month')).toEqual(series)
  })
})

describe('endSeriesAt', () => {
  it('replaces only the last value and leaves the rest alone', () => {
    const points = [
      { date: '1', value: 10 },
      { date: '2', value: 20 },
    ]
    expect(endSeriesAt(points, 25)).toEqual([
      { date: '1', value: 10 },
      { date: '2', value: 25 },
    ])
    expect(endSeriesAt(points, undefined)).toBe(points)
    expect(endSeriesAt([], 25)).toEqual([])
  })
})

describe('usePortfolioChart', () => {
  beforeEach(() => {
    signInAs(ADDRESS)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('fetches the fine and the full series once and serves every range from them', async () => {
    mockedRequest.mockImplementation(async (path: string) => ({
      points: path.includes('days=90')
        ? [point(NOW - 2 * DAY, 'fine'), point(NOW, 'fine')]
        : [point(NOW, 'all')],
    }))
    const { Wrapper } = createQueryWrapper()
    const { result, rerender } = renderHook(({ range }) => usePortfolioChart(range), {
      wrapper: Wrapper,
      initialProps: { range: 'day' as const },
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.points.map(p => p.total_usd)).toEqual(['fine', 'fine'])

    rerender({ range: 'all' as never })
    await waitFor(() => expect(result.current.points.map(p => p.total_usd)).toEqual(['all']))
    rerender({ range: 'week' as never })
    expect(result.current.points.map(p => p.total_usd)).toEqual(['fine', 'fine'])

    const paths = mockedRequest.mock.calls.map(c => c[0]).sort()
    expect(paths).toEqual(['/v1/portfolio/history', '/v1/portfolio/history?days=90'])
  })

  it('reports loading for a range whose series has not landed yet', async () => {
    const all = deferred<PortfolioHistoryResponse>()
    mockedRequest.mockImplementation((path: string) =>
      path.includes('days=90') ? Promise.resolve({ points: [point(NOW)] }) : all.promise,
    )
    const { Wrapper } = createQueryWrapper()
    const { result, rerender } = renderHook(({ range }) => usePortfolioChart(range), {
      wrapper: Wrapper,
      initialProps: { range: 'day' as const },
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    rerender({ range: 'year' as never })
    expect(result.current.isLoading).toBe(true)
    all.resolve({ points: [point(NOW, 'all')] })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.points.map(p => p.total_usd)).toEqual(['all'])
  })
})
