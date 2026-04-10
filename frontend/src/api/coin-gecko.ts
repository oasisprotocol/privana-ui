import { useQuery } from '@tanstack/react-query'
import { getGeckoId } from '../config/tokens'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

export { getGeckoId }

type GeckoResponse = Record<string, Record<string, number>>
type PriceMap = Record<string, number | undefined>

export function useTokenPrices(tokenIds: string[], fiatCurrency = 'usd') {
  const geckoIds = [...new Set(tokenIds.map(getGeckoId).filter((id): id is string => !!id))]

  return useQuery<PriceMap>({
    queryKey: ['coingecko-prices', geckoIds, fiatCurrency],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        ids: geckoIds.join(','),
        vs_currencies: fiatCurrency,
      })
      const res = await fetch(`${COINGECKO_API}/simple/price?${params}`, { signal })
      if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`)
      const data: GeckoResponse = await res.json()

      const result: PriceMap = {}
      for (const tokenId of tokenIds) {
        const geckoId = getGeckoId(tokenId)
        if (geckoId) {
          result[tokenId] = data[geckoId]?.[fiatCurrency]
        }
      }
      return result
    },
    enabled: geckoIds.length > 0,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  })
}
