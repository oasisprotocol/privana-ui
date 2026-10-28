import { afterEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useScrolled } from './use-scrolled'

const scrollTo = (y: number) =>
  act(() => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
    window.dispatchEvent(new Event('scroll'))
  })

describe('useScrolled', () => {
  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })

  it('is false at the top of the page', () => {
    const { result } = renderHook(() => useScrolled())
    expect(result.current).toBe(false)
  })

  it('follows the scroll position', () => {
    const { result } = renderHook(() => useScrolled())
    scrollTo(1)
    expect(result.current).toBe(true)
    scrollTo(0)
    expect(result.current).toBe(false)
  })
})
