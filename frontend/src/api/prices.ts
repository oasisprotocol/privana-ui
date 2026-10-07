import { useQuery } from '@tanstack/react-query'
import { request } from './http'

export interface TokenPrice {
  token_id: string
  usd: string
  updated_at: number
}

export interface PriceListResponse {
  prices: TokenPrice[]
}

type PriceMap = Record<string, number | undefined>

export function useTokenPrices(tokenIds: string[]) {
  return useQuery<Record<string, number>, Error, PriceMap>({
    queryKey: ['token-prices'],
    queryFn: async ({ signal }) => {
      const { prices } = await request<PriceListResponse>('/v1/prices', { signal })
      if (prices.length === 0) throw new Error('No token prices available')
      return Object.fromEntries(prices.map(p => [p.token_id.toLowerCase(), Number(p.usd)]))
    },
    select: byTokenId => Object.fromEntries(tokenIds.map(id => [id, byTokenId[id.toLowerCase()]])),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })
}
