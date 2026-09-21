import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTokenPrices } from './coin-gecko'

const USDC_BASE = '0xaaa'
const USDC_ETH = '0xbbb'
const ETH = '0xccc'
const GECKO: Record<string, string> = { [USDC_BASE]: 'usd-coin', [USDC_ETH]: 'usd-coin', [ETH]: 'ethereum' }

vi.mock('@/config/tokens', () => ({ getGeckoId: (id: string) => GECKO[id] }))

const fetchMock = vi.fn(async () => ({
  ok: true,
  json: async () => ({ 'usd-coin': { usd: 1 }, ethereum: { usd: 2500 } }),
}))

const wrapperFor = (client: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockClear()
})

describe('useTokenPrices', () => {
  it('keys prices by the token ids asked for, even when another pair shares the CoinGecko ids', async () => {
    vi.stubGlobal('fetch', fetchMock)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result, rerender } = renderHook(({ ids }) => useTokenPrices(ids), {
      wrapper: wrapperFor(client),
      initialProps: { ids: [USDC_BASE, ETH] },
    })
    await waitFor(() => expect(result.current.data).toEqual({ [USDC_BASE]: 1, [ETH]: 2500 }))

    rerender({ ids: [USDC_ETH, ETH] })
    await waitFor(() => expect(result.current.data).toEqual({ [USDC_ETH]: 1, [ETH]: 2500 }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shares one fetch across pairs that differ only in order', async () => {
    vi.stubGlobal('fetch', fetchMock)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = wrapperFor(client)
    const a = renderHook(() => useTokenPrices([ETH, USDC_BASE]), { wrapper })
    await waitFor(() => expect(a.result.current.data).toEqual({ [ETH]: 2500, [USDC_BASE]: 1 }))
    const b = renderHook(() => useTokenPrices([USDC_BASE, ETH]), { wrapper })
    await waitFor(() => expect(b.result.current.data).toEqual({ [USDC_BASE]: 1, [ETH]: 2500 }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
