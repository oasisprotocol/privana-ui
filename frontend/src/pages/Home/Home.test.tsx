import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { siweAuth } from '@/test/siwe'
import { Home } from '.'

let login: Mock<() => Promise<void>>

vi.mock('wagmi', () => ({ useConnection: () => ({ isConnected: true, status: 'connected' }) }))
vi.mock('@oasisprotocol/privana-sdk', () => ({
  useSiweAuth: () => ({ ...siweAuth.state, isAuthenticated: !!siweAuth.state.session, login }),
}))
vi.mock('@/hooks/useIsSignedIn', () => ({ useIsSignedIn: () => false }))
vi.mock('@/hooks/useSignOut', () => ({ useSignOut: () => vi.fn() }))
vi.mock('@/hooks/useSlowSettlement', () => ({ useSlowSettlement: () => false }))
vi.mock('@/components/WalletConnect/useSignInForm', () => ({ useSignInForm: () => ({}) }))
vi.mock('@/components/WalletConnect/SignInForm', () => ({ SignInForm: () => null }))
vi.mock('@/components/Layout', () => ({ Layout: ({ children }: { children: ReactNode }) => children }))

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )

beforeEach(() => {
  login = vi.fn(() => Promise.resolve())
  siweAuth.state = { session: null, accessToken: null, isLoading: false, error: null, sessionExpired: false }
})

describe('Home with a connected wallet', () => {
  it('signs in by itself while the session has not ended', () => {
    renderHome()
    expect(login).toHaveBeenCalledTimes(1)
  })

  it('waits for the user once the session ended, and signs on request', async () => {
    siweAuth.state.sessionExpired = true
    renderHome()
    expect(login).not.toHaveBeenCalled()
    expect(screen.getByText('Your session ended. Sign the message to continue.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Sign message' }))
    expect(login).toHaveBeenCalledTimes(1)
  })
})
