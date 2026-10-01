import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { request } from '@/api/http'
import { useTokenPrices, type PriceListResponse } from './prices'

vi.mock('@/api/http', () => ({ request: vi.fn() }))

const USDC = '0xaaa'
const ETH = '0xbbb'
const UNPRICED = '0xccc'

const PRICES: PriceListResponse = {
  prices: [
    { token_id: USDC, usd: '0.99985100', updated_at: 1 },
    { token_id: ETH.toUpperCase(), usd: '2500.00000000', updated_at: 1 },
  ],
}

const wrapperFor = (client: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

afterEach(() => {
  vi.mocked(request).mockReset()
})

describe('useTokenPrices', () => {
  it('picks the requested token ids out of the services price list', async () => {
    vi.mocked(request).mockResolvedValue(PRICES)
    const { result } = renderHook(() => useTokenPrices([USDC, ETH, UNPRICED]), {
      wrapper: wrapperFor(newClient()),
    })
    await waitFor(() =>
      expect(result.current.data).toEqual({ [USDC]: 0.999851, [ETH]: 2500, [UNPRICED]: undefined }),
    )
    expect(request).toHaveBeenCalledWith('/v1/prices', expect.anything())
  })

  it('shares one fetch across callers asking for different tokens', async () => {
    vi.mocked(request).mockResolvedValue(PRICES)
    const wrapper = wrapperFor(newClient())
    const a = renderHook(() => useTokenPrices([USDC]), { wrapper })
    await waitFor(() => expect(a.result.current.data).toEqual({ [USDC]: 0.999851 }))
    const b = renderHook(() => useTokenPrices([ETH]), { wrapper })
    await waitFor(() => expect(b.result.current.data).toEqual({ [ETH]: 2500 }))
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('reports an empty price list as an error, not as zero prices', async () => {
    vi.mocked(request).mockResolvedValue({ prices: [] })
    const { result } = renderHook(() => useTokenPrices([USDC]), { wrapper: wrapperFor(newClient()) })
    // The hook retries once (~1 s) before giving up.
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 })
  })
})
