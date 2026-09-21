import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { WalletClient } from 'viem'
import { ApiError } from '@/api/http'
import { depositEarn, type DepositQuoteResponse } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { OPERATION_PENDING_MESSAGE } from '@/lib/errors'
import { useSubmitEarnDeposit } from './useSubmitEarnDeposit'

vi.mock('@oasisprotocol/privana-sdk', () => ({ signTransferMessage: vi.fn(async () => '0xsig') }))
vi.mock('@/api/earn', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api/earn')>()),
  depositEarn: vi.fn(),
}))
const activity = { addActivity: vi.fn(), updateActivity: vi.fn(), removeActivity: vi.fn() }
vi.mock('@/contexts/ActivityProvider/useActivity', () => ({ useActivity: () => activity }))

const token = { token_id: '0x1', token_symbol: 'USDC', token_decimals: 6 } as TokenInfo
const quote = {
  pool_address: '0x' + 'b'.repeat(40),
  token_id: '0x1',
  amount: '1000000',
  transfer_nonce: 7,
} as unknown as DepositQuoteResponse
const params = {
  quote,
  walletClient: {} as WalletClient,
  address: ('0x' + 'a'.repeat(40)) as `0x${string}`,
  token,
  poolId: '0xpool',
  protocol: 'aave',
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

beforeEach(() => vi.clearAllMocks())

describe('useSubmitEarnDeposit', () => {
  it('drops the optimistic entry and returns to review when the backend refuses with 409', async () => {
    vi.mocked(depositEarn).mockRejectedValue(new ApiError(409, 'A previous operation is still pending'))
    const onRefused = vi.fn()
    const { result } = renderHook(() => useSubmitEarnDeposit({ onRefused }), { wrapper })

    let id: string | null = null
    await act(async () => {
      id = await result.current.execute(params)
    })

    expect(id).not.toBeNull()
    await waitFor(() => expect(activity.removeActivity).toHaveBeenCalledWith(id))
    expect(activity.updateActivity).not.toHaveBeenCalled()
    expect(onRefused).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBe(OPERATION_PENDING_MESSAGE)
    expect(result.current.loading).toBe(false)
  })
})
