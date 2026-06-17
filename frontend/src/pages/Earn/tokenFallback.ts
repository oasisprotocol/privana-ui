import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import type { TokenInfo } from '@/api/swap/types'

type SdkTokenConfig = ReturnType<ReturnType<typeof usePrivanaContext>['getTokenById']>

// TEMPORARY: shapes an SDK TokenConfig (sourced from accounting) into the
// swap-service TokenInfo so earn screens can resolve assets the swap
// SUPPORTED_TOKEN_IDS env doesn't list. Remove once /v1/tokens covers
// every earn pool asset.
export function sdkTokenAsTokenInfo(token: SdkTokenConfig): TokenInfo | undefined {
  if (!token) return undefined
  return {
    token_id: token.id,
    token_type: 0,
    token_type_name: token.name,
    chain_id: token.chainId,
    chain_name: null,
    token_address: token.contract,
    token_symbol: token.symbol,
    token_name: token.name,
    token_decimals: token.decimals,
  }
}
