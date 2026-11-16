import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
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
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

beforeEach(() => vi.clearAllMocks())

const addedId = () => vi.mocked(activity.addActivity).mock.calls[0][0].id

const submit = async (options: Parameters<typeof useSubmitSwap>[0] = {}) => {
  const { result } = renderHook(() => useSubmitSwap(options), { wrapper })
  let submitted: Awaited<ReturnType<typeof result.current.execute>> = null
  await act(async () => {
    submitted = await result.current.execute(params)
  })
  return { result, submitted }
}

describe('useSubmitSwap', () => {
  it('resolves with the operation id once the swap is scheduled', async () => {
    vi.mocked(executeSwap).mockResolvedValue({
      swap_id: 'srv-1',
      status: 'scheduled',
      message: '',
      tx_hash: null,
    })
    const onSuccess = vi.fn()
    const { submitted } = await submit({ onSuccess })

    expect(submitted).toEqual({ operationId: 'srv-1' })
    expect(activity.updateActivity).toHaveBeenCalledWith(addedId(), {
      swapId: 'srv-1',
      txHash: undefined,
      status: 'in-progress',
    })
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('drops the optimistic entry and returns to review when the backend refuses with 409', async () => {
    vi.mocked(executeSwap).mockRejectedValue(new ApiError(409, 'A previous operation is still pending'))
    const onRefused = vi.fn()
    const { result, submitted } = await submit({ onRefused })

    expect(submitted).toBeNull()
    expect(activity.removeActivity).toHaveBeenCalledWith(addedId())
    expect(activity.updateActivity).not.toHaveBeenCalled()
    expect(onRefused).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBe(OPERATION_PENDING_MESSAGE)
  })

  it('drops the entry and stays on review for any other 4xx', async () => {
    vi.mocked(executeSwap).mockRejectedValue(new ApiError(400, 'Quote has expired'))
    const onRefused = vi.fn()
    const { result, submitted } = await submit({ onRefused })

    expect(submitted).toBeNull()
    expect(activity.removeActivity).toHaveBeenCalledWith(addedId())
    expect(activity.updateActivity).not.toHaveBeenCalled()
    expect(onRefused).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Quote has expired')
  })

  it('keeps the entry in progress when the outcome is unknown', async () => {
    vi.mocked(executeSwap).mockRejectedValue(new TypeError('Failed to fetch'))
    const { result, submitted } = await submit()

    expect(submitted).toEqual({})
    expect(activity.removeActivity).not.toHaveBeenCalled()
    expect(activity.updateActivity).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })
})
