import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { siweAuth } from '@/test/siwe'
import { useAuthBootstrapping } from './useAuthBootstrapping'

let status: string
let connectedWallet: object | null

vi.mock('wagmi', () => ({ useConnection: () => ({ status }) }))
vi.mock('@oasisprotocol/privana-sdk', () => ({ useSiweAuth: () => siweAuth.state }))
vi.mock('@/wallet/turnkeyIntent', () => ({ useTurnkeyWalletIntent: () => null }))
vi.mock('@/wallet/turnkeyConnectedWallet', () => ({ useConnectedWalletRecord: () => connectedWallet }))

beforeEach(() => {
  status = 'connected'
  siweAuth.state = { session: null, accessToken: null, isLoading: false, error: null, sessionExpired: false }
  connectedWallet = { address: '0x1' }
})

describe('useAuthBootstrapping', () => {
  it('waits while a connected wallet is still signing in', () => {
    expect(renderHook(() => useAuthBootstrapping()).result.current).toBe(true)
  })

  it('settles on an ended session, so the gate sends the user to sign again', () => {
    siweAuth.state.sessionExpired = true
    expect(renderHook(() => useAuthBootstrapping()).result.current).toBe(false)
  })

  it('settles on a failed sign-in', () => {
    siweAuth.state.error = new Error('rejected')
    expect(renderHook(() => useAuthBootstrapping()).result.current).toBe(false)
  })
})
