import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import { useMenuOpen } from './use-menu-open'

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={['/dashboard', '/trade']} initialIndex={1}>
    {children}
  </MemoryRouter>
)

const renderMenu = () =>
  renderHook(
    () => {
      const [open, setOpen] = useMenuOpen()
      return { open, setOpen, navigate: useNavigate() }
    },
    { wrapper },
  )

describe('useMenuOpen', () => {
  it('stays open until the location changes', () => {
    const { result } = renderMenu()
    act(() => result.current.setOpen(true))
    expect(result.current.open).toBe(true)
    act(() => result.current.navigate('/transfer'))
    expect(result.current.open).toBe(false)
  })

  it('closes on browser back and does not reopen on forward', () => {
    const { result } = renderMenu()
    act(() => result.current.setOpen(true))
    act(() => result.current.navigate(-1))
    expect(result.current.open).toBe(false)
    act(() => result.current.navigate(1))
    expect(result.current.open).toBe(false)
  })
})
