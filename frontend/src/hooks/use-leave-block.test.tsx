import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { useLeaveBlock } from './use-leave-block'

let blocked = false
let stepBack: (() => void) | undefined

const Page = () => {
  useLeaveBlock(blocked, stepBack)
  return <p>page</p>
}

// The page sits on top of the dashboard in history, so a browser back is a POP to '/'.
const renderPage = () => {
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>dashboard</p> },
      { path: '/deposit', element: <Page /> },
    ],
    { initialEntries: ['/', '/deposit'], initialIndex: 1 },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  blocked = false
  stepBack = undefined
})

describe('useLeaveBlock', () => {
  it('lets browser back leave the page when there is no step to go back to', async () => {
    const router = renderPage()
    await act(() => router.navigate(-1))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('turns browser back into a step back inside the flow', async () => {
    stepBack = vi.fn()
    const router = renderPage()
    await act(() => router.navigate(-1))
    await waitFor(() => expect(stepBack).toHaveBeenCalledTimes(1))
    expect(router.state.location.pathname).toBe('/deposit')
  })

  it('still lets a link leave the page while there is a step to go back to', async () => {
    stepBack = vi.fn()
    const router = renderPage()
    await act(() => router.navigate('/'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(stepBack).not.toHaveBeenCalled()
  })

  it('keeps the user on the page while blocked, without stepping back', async () => {
    blocked = true
    stepBack = vi.fn()
    const router = renderPage()
    await act(() => router.navigate(-1))
    await act(() => router.navigate('/'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/deposit'))
    expect(stepBack).not.toHaveBeenCalled()
  })
})
