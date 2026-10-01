import { useQuery } from '@tanstack/react-query'
import { getGeckoId } from '../config/tokens'

const PRICES_API = 'https://coins.llama.fi/prices/current'

export { getGeckoId }

type PricesResponse = { coins: Record<string, { price: number } | undefined> }
type GeckoPriceMap = Record<string, number | undefined>
type PriceMap = Record<string, number | undefined>

export function useTokenPrices(tokenIds: string[]) {
  const geckoIds = [...new Set(tokenIds.map(getGeckoId).filter((id): id is string => !!id))].sort()

  return useQuery<GeckoPriceMap, Error, PriceMap>({
    queryKey: ['token-prices', geckoIds],
    queryFn: async ({ signal }) => {
      const coins = geckoIds.map(id => `coingecko:${id}`).join(',')
      const res = await fetch(`${PRICES_API}/${coins}`, { signal })
      if (!res.ok) throw new Error(`Price API error: ${res.status}`)
      const data: PricesResponse = await res.json()
      return Object.fromEntries(geckoIds.map(id => [id, data.coins[`coingecko:${id}`]?.price]))
    },
    select: byGeckoId => {
      const result: PriceMap = {}
      for (const tokenId of tokenIds) {
        const geckoId = getGeckoId(tokenId)
        if (geckoId) result[tokenId] = byGeckoId[geckoId]
      }
      return result
    },
    enabled: geckoIds.length > 0,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  })
}
