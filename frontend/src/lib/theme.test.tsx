import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const loadTheme = () => import('@/lib/theme')

describe('theme', () => {
  beforeEach(() => {
    vi.resetModules()
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to the system preference and resolves light', async () => {
    const theme = await loadTheme()
    const { result: pref } = renderHook(() => theme.useThemePreference())
    const { result: resolved } = renderHook(() => theme.useResolvedTheme())
    expect(pref.current).toBe('system')
    expect(resolved.current).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('applies a stored preference at load time', async () => {
    window.localStorage.setItem('privana.theme', 'dark')
    const theme = await loadTheme()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    const { result } = renderHook(() => theme.useResolvedTheme())
    expect(result.current).toBe('dark')
  })

  it('falls back to system for an invalid stored value', async () => {
    window.localStorage.setItem('privana.theme', 'blue')
    const theme = await loadTheme()
    const { result } = renderHook(() => theme.useThemePreference())
    expect(result.current).toBe('system')
  })

  it('setThemePreference updates subscribers, storage, and the DOM', async () => {
    const theme = await loadTheme()
    const { result } = renderHook(() => theme.useResolvedTheme())

    act(() => theme.setThemePreference('dark'))
    expect(result.current).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem('privana.theme')).toBe('dark')

    act(() => theme.setThemePreference('light'))
    expect(result.current).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem('privana.theme')).toBe('light')
  })
})
