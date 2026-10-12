import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { getQuote } from '@/api/swap'
import type { QuoteResponse } from '@/api/swap'
import { useSwapQuote } from './useSwapQuote'

vi.mock('@/api/swap', () => ({ getQuote: vi.fn() }))

// Fixed epoch so seconds map to exact fake-timer milliseconds.
const NOW_MS = 1_000_000_000_000

const quote = (expiresInSec: number) =>
  ({
    quote_id: 'q1',
    from_amount: '1000000',
    to_amount_estimate: '1',
    expires_at: Math.floor(Date.now() / 1000) + expiresInSec,
  }) as unknown as QuoteResponse

const params = {
  fromTokenId: '0x1',
  toTokenId: '0x2',
  fromAmount: '1',
  address: '0xa',
  fromDecimals: 6,
  toDecimals: 6,
  toSymbol: 'USDC',
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW_MS)
  vi.mocked(getQuote).mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSwapQuote', () => {
  it('refreshes a 30-minute quote after 30 seconds', async () => {
    vi.mocked(getQuote).mockImplementation(async () => quote(1800))
    renderHook(() => useSwapQuote(params))
    await act(async () => {})

    await act(() => vi.advanceTimersByTimeAsync(29_999))
    expect(getQuote).toHaveBeenCalledOnce()
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(getQuote).toHaveBeenCalledTimes(2)
  })

  it('refreshes at expiry when the quote expires sooner', async () => {
    vi.mocked(getQuote).mockImplementation(async () => quote(10))
    renderHook(() => useSwapQuote(params))
    await act(async () => {})

    await act(() => vi.advanceTimersByTimeAsync(9_999))
    expect(getQuote).toHaveBeenCalledOnce()
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(getQuote).toHaveBeenCalledTimes(2)
  })

  it('drops the quote at once when the slippage changes, and fetches one for the new slippage', async () => {
    vi.mocked(getQuote)
      .mockImplementationOnce(async () => quote(1800))
      .mockImplementationOnce(() => new Promise(() => {}))
    const { result, rerender } = renderHook(
      (props: { slippageFraction?: number }) => useSwapQuote({ ...params, ...props }),
      { initialProps: {} },
    )
    await act(async () => {})
    expect(vi.mocked(getQuote).mock.calls[0][0].slippageFraction).toBeUndefined()
    expect(result.current.data).not.toBeNull()

    rerender({ slippageFraction: 0.01 })
    await act(async () => {})
    expect(getQuote).toHaveBeenCalledTimes(2)
    expect(vi.mocked(getQuote).mock.calls[1][0].slippageFraction).toBe(0.01)
    // The quote for the old slippage can no longer be shown or submitted.
    expect(result.current.data).toBeNull()
  })

  it('counts as refreshing from 5 seconds before a refresh until the new quote arrives', async () => {
    let arrive: (q: QuoteResponse) => void = () => {}
    vi.mocked(getQuote)
      .mockImplementationOnce(async () => quote(1800))
      .mockImplementationOnce(() => new Promise(resolve => (arrive = resolve)))
    const { result } = renderHook(() => useSwapQuote(params))
    await act(async () => {})

    await act(() => vi.advanceTimersByTimeAsync(24_999))
    expect(result.current.refreshing).toBe(false)
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(result.current.refreshing).toBe(true)

    // The refetch is in flight and the old quote is still shown.
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(getQuote).toHaveBeenCalledTimes(2)
    expect(result.current.refreshing).toBe(true)

    await act(async () => arrive(quote(1800)))
    expect(result.current.refreshing).toBe(false)
  })
})
