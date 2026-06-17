import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import type { TokenInfo } from '@/api/swap/types'

// Earn assets can be a superset of swap's SUPPORTED_TOKEN_IDS (e.g. AAVE_POOL_ASSETS
// has tokens that aren't swappable). Resolve via the SDK token registry — sourced
// from accounting — so earn never depends on swap's curated list.
export function useEarnToken(tokenId: string | undefined): TokenInfo | undefined {
  const { getTokenById, getChainById } = usePrivanaContext()
  if (!tokenId) return undefined
  const token = getTokenById(tokenId)
  if (!token) return undefined
  return {
    token_id: token.id,
    token_type: 0,
    token_type_name: token.name,
    chain_id: token.chainId,
    chain_name: getChainById(token.chainId)?.name ?? null,
    token_address: token.contract,
    token_symbol: token.symbol,
    token_name: token.name,
    token_decimals: token.decimals,
  }
}
