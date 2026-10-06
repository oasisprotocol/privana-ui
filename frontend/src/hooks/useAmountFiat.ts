import { useMemo } from 'react'
import { useTokenPrices } from '@/api/coin-gecko'
import type { TokenInfo } from '@/api/swap'
import { amountFiat } from '@/lib/tokens'

// Fiat value of a human-entered token amount, or undefined while prices/token
// aren't ready. Shared by the earn amount field and the deposit review.
export const useAmountFiat = (token: TokenInfo | undefined, amount: string): number | undefined => {
  const tokenIds = useMemo(() => (token ? [token.token_id] : []), [token])
  const { data: prices } = useTokenPrices(tokenIds)
  return useMemo(
    () => (token ? amountFiat(amount, token.token_decimals, prices?.[token.token_id]) : undefined),
    [prices, amount, token],
  )
}
