import { useMemo } from 'react'
import { usePrivanaContext, useBatchBalances } from '@oasisprotocol/privana-sdk'
import { useTokenPrices } from '@/api/prices'
import { mergeTokensBySymbol, type MergedTokenAmount } from '@/lib/tokens'

export interface Holdings {
  /** Available balances merged by symbol, with per-symbol fiat. */
  tokenHoldings: MergedTokenAmount[]
}

// Row data for the dashboard Holdings section. Applies the same merge-by-symbol
// rule as useFunds and reads the same cached queries it sits on, so it costs no
// extra fetches.
export function useHoldings(): Holdings {
  const { enabledTokens, getTokenById } = usePrivanaContext()
  const tokenIds = useMemo(() => enabledTokens.map(t => t.id), [enabledTokens])
  const { balances } = useBatchBalances({ tokenIds })
  const { data: prices } = useTokenPrices(tokenIds)

  const tokenHoldings = useMemo(
    () =>
      mergeTokensBySymbol(
        balances.map(b => ({ tokenId: b.token_id, amount: b.balance, symbol: b.token_symbol })),
        getTokenById,
        prices,
      ),
    [balances, prices, getTokenById],
  )

  return { tokenHoldings }
}
