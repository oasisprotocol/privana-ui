import { useQuery } from '@tanstack/react-query'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

/**
 * Maps FlexVaults token IDs to CoinGecko IDs.
 * Test tokens are mapped to real tokens for testing
 */
const TOKEN_ID_TO_GECKO_ID: Record<string, string> = {
  '0x330ba47d00c7ce3018deee017b319fd7cc6473a2ddc9e6eba6ebb4207be15279': 'usd-coin',
  '0x335b5cccd1e63b2fe79863a0db73fce430e4e66902e2b78424f8662621e29fb7': 'ethereum',
}

export const getGeckoId = (tokenId: string): string | undefined => TOKEN_ID_TO_GECKO_ID[tokenId]

type GeckoResponse = Record<string, Record<string, number>>
type PriceMap = Record<string, number | undefined>

export function useTokenPrices(tokenIds: string[], fiatCurrency = 'usd') {
  const geckoIds = [...new Set(tokenIds.map(getGeckoId).filter((id): id is string => !!id))]

  return useQuery<PriceMap>({
    queryKey: ['coingecko-prices', geckoIds, fiatCurrency],
    queryFn: async () => {
      const params = new URLSearchParams({
        ids: geckoIds.join(','),
        vs_currencies: fiatCurrency,
      })
      const res = await fetch(`${COINGECKO_API}/simple/price?${params}`)
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
    staleTime: 1000 * 60 * 3,
    refetchInterval: 1000 * 60 * 3,
  })
}
