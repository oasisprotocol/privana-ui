import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useQuoteExpiry } from './use-quote-expiry'

// Fixed epoch so expires_at (seconds) maps to exact fake-timer milliseconds.
const NOW_MS = 1_000_000_000_000
const nowSec = NOW_MS / 1000

const quote = (expiresInSec: number) => ({ quote_id: 'q1', expires_at: nowSec + expiresInSec })

describe('useQuoteExpiry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW_MS)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('refetches exactly when the quote expires', () => {
    const onRefetch = vi.fn()
    renderHook(() => useQuoteExpiry({ data: quote(30), onRefetch }))

    act(() => vi.advanceTimersByTime(29_999))
    expect(onRefetch).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onRefetch).toHaveBeenCalledOnce()
  })

  it('does nothing without a quote', () => {
    const onRefetch = vi.fn()
    renderHook(() => useQuoteExpiry({ data: null, onRefetch }))
    act(() => vi.advanceTimersByTime(600_000))
    expect(onRefetch).not.toHaveBeenCalled()
  })

  it('refetches immediately for an already-expired quote', () => {
    const onRefetch = vi.fn()
    renderHook(() => useQuoteExpiry({ data: quote(-5), onRefetch }))
    act(() => vi.advanceTimersByTime(0))
    expect(onRefetch).toHaveBeenCalledOnce()
  })

  it('re-arms on a fresh quote instead of firing for the stale one', () => {
    const onRefetch = vi.fn()
    const { rerender } = renderHook(({ data }) => useQuoteExpiry({ data, onRefetch }), {
      initialProps: { data: quote(10) },
    })

    rerender({ data: { quote_id: 'q2', expires_at: nowSec + 30 } })
    act(() => vi.advanceTimersByTime(15_000))
    expect(onRefetch).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(15_000))
    expect(onRefetch).toHaveBeenCalledOnce()
  })

  it('always invokes the latest onRefetch callback', () => {
    const stale = vi.fn()
    const fresh = vi.fn()
    const { rerender } = renderHook(({ onRefetch }) => useQuoteExpiry({ data: quote(30), onRefetch }), {
      initialProps: { onRefetch: stale },
    })

    rerender({ onRefetch: fresh })
    act(() => vi.advanceTimersByTime(30_000))
    expect(stale).not.toHaveBeenCalled()
    expect(fresh).toHaveBeenCalledOnce()
  })
})
