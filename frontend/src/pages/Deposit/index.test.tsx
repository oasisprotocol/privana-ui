import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { Deposit } from '.'

// Like the SDK modal, it reads defaultTab only on mount.
vi.mock('@oasisprotocol/privana-sdk', async () => {
  const { useState } = await import('react')
  return {
    DepositInlineModal: ({
      defaultTab,
      onDepositSuccess,
    }: {
      defaultTab: string
      onDepositSuccess: () => void
    }) => {
      const [tab] = useState(defaultTab)
      return <button onClick={onDepositSuccess}>tab: {tab}</button>
    },
  }
})

const renderDeposit = (initialEntry: string) => {
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>dashboard</p> },
      { path: '/deposit', element: <Deposit /> },
    ],
    { initialEntries: [initialEntry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('Deposit', () => {
  it('opens the other tab when a link changes it on the page', async () => {
    const router = renderDeposit('/deposit?tab=card')
    expect(screen.getByRole('button', { name: 'tab: credit-card' })).toBeInTheDocument()

    await act(() => router.navigate('/deposit'))

    expect(screen.getByRole('button', { name: 'tab: crypto' })).toBeInTheDocument()
  })

  it('starts over when the page is opened again from the success screen', async () => {
    const router = renderDeposit('/deposit')
    act(() => screen.getByRole('button', { name: 'tab: crypto' }).click())
    expect(screen.getByRole('heading', { name: 'Deposit complete' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Deposit' })).not.toBeInTheDocument()

    await act(() => router.navigate('/deposit'))

    expect(screen.getByRole('button', { name: 'tab: crypto' })).toBeInTheDocument()
  })
})
