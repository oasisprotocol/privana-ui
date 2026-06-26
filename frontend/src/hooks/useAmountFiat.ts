import { useMemo } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useTokenPrices } from '@/api/coin-gecko'
import type { TokenInfo } from '@/api/swap'

// Fiat value of a human-entered token amount, or undefined while prices/token
// aren't ready. Shared by the earn amount field and the deposit review.
export const useAmountFiat = (token: TokenInfo | undefined, amount: string): number | undefined => {
  const tokenIds = useMemo(() => (token ? [token.token_id] : []), [token])
  const { data: prices } = useTokenPrices(tokenIds)
  return useMemo(() => {
    if (!prices || !amount || !token || token.token_decimals == null) return undefined
    const price = prices[token.token_id]
    if (price == null) return undefined
    try {
      const units = parseUnits(amount, token.token_decimals)
      const asNum = Number(formatUnits(units, token.token_decimals))
      return Number.isFinite(asNum) ? asNum * price : undefined
    } catch {
      return undefined
    }
  }, [prices, amount, token])
}
