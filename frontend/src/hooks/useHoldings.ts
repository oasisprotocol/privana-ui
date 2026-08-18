import { useMemo } from 'react'
import { formatUnits } from 'viem'
import { usePrivanaContext, useBatchBalances } from '@oasisprotocol/privana-sdk'
import { useEarnBalance, useEarnPools } from '@/api/earn'
import { useTokenPrices } from '@/api/coin-gecko'
import { mergeTokensBySymbol, type MergedTokenAmount } from '@/lib/tokens'

export interface EarnHolding {
  poolId: string
  strategy: string | undefined
  symbol: string | undefined
  apyBps: number | undefined
  fiat: number | undefined
}

export interface Holdings {
  /** Available balances merged by symbol, with per-symbol fiat. */
  tokenHoldings: MergedTokenAmount[]
  /** One entry per active earn position, joined with its pool for strategy/APY. */
  earnHoldings: EarnHolding[]
}

// Row data for the dashboard Holdings section. Applies the same merge-by-symbol
// rule as useFunds and reads the same cached queries it sits on, so it costs no
// extra fetches.
export function useHoldings(): Holdings {
  const { enabledTokens, getTokenById } = usePrivanaContext()
  const tokenIds = useMemo(() => enabledTokens.map(t => t.id), [enabledTokens])
  const { balances } = useBatchBalances({ tokenIds })
  const { data: prices } = useTokenPrices(tokenIds)
  const { data: earnBalance } = useEarnBalance()
  const { data: poolsData } = useEarnPools()

  const tokenHoldings = useMemo(
    () =>
      mergeTokensBySymbol(
        balances.map(b => ({ tokenId: b.token_id, amount: b.balance, symbol: b.token_symbol })),
        getTokenById,
        prices,
      ),
    [balances, prices, getTokenById],
  )

  const earnHoldings = useMemo(() => {
    const poolsById = new Map((poolsData?.pools ?? []).map(p => [p.pool_id, p]))
    return (earnBalance?.positions ?? [])
      .filter(p => BigInt(p.underlying_amount || '0') > 0n)
      .map(p => {
        const pool = poolsById.get(p.pool_id)
        const token = getTokenById(p.token_id)
        const price = prices?.[p.token_id]
        const fiat =
          token && price != null
            ? Number(formatUnits(BigInt(p.underlying_amount || '0'), token.decimals)) * price
            : undefined
        return {
          poolId: p.pool_id,
          strategy: pool?.strategy,
          symbol: token?.symbol,
          apyBps: pool?.apy_bps,
          fiat,
        }
      })
  }, [earnBalance, poolsData, prices, getTokenById])

  return { tokenHoldings, earnHoldings }
}
