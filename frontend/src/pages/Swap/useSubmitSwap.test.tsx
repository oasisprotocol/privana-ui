import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { WalletClient } from 'viem'
import { ApiError } from '@/api/http'
import { executeSwap } from '@/api/swap'
import type { QuoteResponse, TokenInfo } from '@/api/swap'
import { OPERATION_PENDING_MESSAGE } from '@/lib/errors'
import { useSubmitSwap } from './useSubmitSwap'

vi.mock('@oasisprotocol/privana-sdk', () => ({ signTransferMessage: vi.fn(async () => '0xsig') }))
vi.mock('@/api/swap', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api/swap')>()),
  executeSwap: vi.fn(),
}))
const activity = { addActivity: vi.fn(), updateActivity: vi.fn(), removeActivity: vi.fn() }
vi.mock('@/contexts/ActivityProvider/useActivity', () => ({ useActivity: () => activity }))

const token = { token_id: '0x1', token_symbol: 'USDC', token_decimals: 6 } as TokenInfo
const quote = {
  quote_id: 'q1',
  liquidity_provider: '0x' + 'b'.repeat(40),
  from_token_id: '0x1',
  from_amount: '1000000',
  to_amount_estimate: '1',
  transfer_nonce: 7,
} as unknown as QuoteResponse
const params = {
  quote,
  walletClient: {} as WalletClient,
  address: ('0x' + 'a'.repeat(40)) as `0x${string}`,
  fromToken: token,
  toToken: token,
  rateLabel: '',
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

beforeEach(() => vi.clearAllMocks())

describe('useSubmitSwap', () => {
  it('drops the optimistic entry and returns to review when the backend refuses with 409', async () => {
    vi.mocked(executeSwap).mockRejectedValue(new ApiError(409, 'A previous operation is still pending'))
    const onRefused = vi.fn()
    const { result } = renderHook(() => useSubmitSwap({ onRefused }), { wrapper })

    let id: string | null = null
    await act(async () => {
      id = await result.current.execute(params)
    })

    expect(id).not.toBeNull()
    await waitFor(() => expect(activity.removeActivity).toHaveBeenCalledWith(id))
    expect(activity.updateActivity).not.toHaveBeenCalled()
    expect(onRefused).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBe(OPERATION_PENDING_MESSAGE)
  })

  it('still records any other 4xx as a failed swap', async () => {
    vi.mocked(executeSwap).mockRejectedValue(new ApiError(400, 'Quote has expired'))
    const onRefused = vi.fn()
    const { result } = renderHook(() => useSubmitSwap({ onRefused }), { wrapper })

    let id: string | null = null
    await act(async () => {
      id = await result.current.execute(params)
    })

    await waitFor(() =>
      expect(activity.updateActivity).toHaveBeenCalledWith(id, {
        status: 'failed',
        error: 'Quote has expired',
      }),
    )
    expect(activity.removeActivity).not.toHaveBeenCalled()
    expect(onRefused).not.toHaveBeenCalled()
  })
})
