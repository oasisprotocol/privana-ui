import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { forgetBootSession, useBootPhase } from './useBootPhase'

const KEY = '0xabc:true'

const bootThrough = () => {
  const hook = renderHook(({ loading }) => useBootPhase(loading, KEY), {
    initialProps: { loading: true },
  })
  expect(hook.result.current).toBe('loading')
  hook.rerender({ loading: false })
  expect(hook.result.current).toBe('confirming')
  act(() => vi.advanceTimersByTime(1100))
  expect(hook.result.current).toBe('done')
  return hook
}

describe('useBootPhase', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    forgetBootSession()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('plays loading -> confirming -> done on first boot', () => {
    bootThrough()
  })

  it('stays done when loading flips back on while mounted', () => {
    const hook = bootThrough()
    hook.rerender({ loading: true })
    expect(hook.result.current).toBe('done')
  })

  it('skips the boot on a remount of the same session, even while loading', () => {
    bootThrough().unmount()
    // Back from a swap: caches dropped, reads in flight again.
    const { result } = renderHook(() => useBootPhase(true, KEY))
    expect(result.current).toBe('done')
  })

  it('replays the boot when the session key changes', () => {
    bootThrough()
    const { result } = renderHook(() => useBootPhase(true, '0xother:true'))
    expect(result.current).toBe('loading')
  })

  it('replays the boot after forgetBootSession', () => {
    bootThrough().unmount()
    forgetBootSession()
    const { result } = renderHook(() => useBootPhase(true, KEY))
    expect(result.current).toBe('loading')
  })

  it('remembers an instant boot (mounted with warm caches)', () => {
    const first = renderHook(() => useBootPhase(false, KEY))
    expect(first.result.current).toBe('done')
    first.unmount()
    const { result } = renderHook(() => useBootPhase(true, KEY))
    expect(result.current).toBe('done')
  })
})
