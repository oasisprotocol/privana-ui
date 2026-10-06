import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuthBootstrapping } from './useAuthBootstrapping'

let status: string
let siwe: { isLoading: boolean; error: Error | null; sessionExpired: boolean }
let connectedWallet: object | null

vi.mock('wagmi', () => ({ useConnection: () => ({ status }) }))
vi.mock('@oasisprotocol/privana-sdk', () => ({ useSiweAuth: () => siwe }))
vi.mock('@/wallet/turnkeyIntent', () => ({ useTurnkeyWalletIntent: () => null }))
vi.mock('@/wallet/turnkeyConnectedWallet', () => ({ useConnectedWalletRecord: () => connectedWallet }))

beforeEach(() => {
  status = 'connected'
  siwe = { isLoading: false, error: null, sessionExpired: false }
  connectedWallet = { address: '0x1' }
})

describe('useAuthBootstrapping', () => {
  it('waits while a connected wallet is still signing in', () => {
    expect(renderHook(() => useAuthBootstrapping()).result.current).toBe(true)
  })

  it('settles on an ended session, so the gate sends the user to sign again', () => {
    siwe.sessionExpired = true
    expect(renderHook(() => useAuthBootstrapping()).result.current).toBe(false)
  })

  it('settles on a failed sign-in', () => {
    siwe.error = new Error('rejected')
    expect(renderHook(() => useAuthBootstrapping()).result.current).toBe(false)
  })
})
