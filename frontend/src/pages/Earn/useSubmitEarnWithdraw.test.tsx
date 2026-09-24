import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { WalletClient } from 'viem'
import { ApiError, getWithdrawNonce, withdrawEarn, type WithdrawResponse } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { useSubmitEarnWithdraw } from './useSubmitEarnWithdraw'

vi.mock('@oasisprotocol/privana-sdk', () => ({ useSiweAuth: () => ({ accessToken: 'jwt' }) }))
vi.mock('@/api/earn', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api/earn')>()),
  getWithdrawNonce: vi.fn(),
  withdrawEarn: vi.fn(),
}))
vi.mock('./signWithdrawConsent', () => ({ signWithdrawConsent: vi.fn(async () => '0xsig') }))
const activity = { addActivity: vi.fn(), updateActivity: vi.fn(), removeActivity: vi.fn() }
vi.mock('@/contexts/ActivityProvider/useActivity', () => ({ useActivity: () => activity }))

const params = {
  amount: '1000000',
  walletClient: {} as WalletClient,
  address: ('0x' + 'a'.repeat(40)) as `0x${string}`,
  token: { token_id: '0x1', token_symbol: 'USDC', token_decimals: 6 } as TokenInfo,
  poolId: '0xpool',
  protocol: 'aave',
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

beforeEach(() => vi.clearAllMocks())

describe('useSubmitEarnWithdraw', () => {
  it('records the fresh nonce on the entry before retrying a stale-nonce submit', async () => {
    const nonceOf = (nonce: number) => ({ user_address: params.address, nonce })
    vi.mocked(getWithdrawNonce).mockResolvedValueOnce(nonceOf(5)).mockResolvedValueOnce(nonceOf(6))
    vi.mocked(withdrawEarn)
      .mockRejectedValueOnce(new ApiError(400, 'Invalid nonce'))
      .mockResolvedValueOnce({
        withdraw_id: 'srv-1',
        status: 'scheduled',
        tx_hash: null,
      } as unknown as WithdrawResponse)
    const { result } = renderHook(() => useSubmitEarnWithdraw(), { wrapper })

    let id: string | null = null
    await act(async () => {
      id = await result.current.execute(params)
    })

    expect(activity.addActivity).toHaveBeenCalledWith(expect.objectContaining({ id, nonce: '5' }))
    await waitFor(() => expect(withdrawEarn).toHaveBeenCalledTimes(2))
    expect(activity.updateActivity).toHaveBeenCalledWith(id, { nonce: '6' })
    expect(vi.mocked(withdrawEarn).mock.calls[1][0]).toMatchObject({ nonce: 6 })
  })
})
