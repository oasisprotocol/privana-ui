export interface QuoteParams {
  fromTokenId: string
  toTokenId: string
  fromAmount: string
  userAddress: string
  slippage?: number
}

export interface QuoteResponse {
  quote_id: string
  from_token_id: string
  to_token_id: string
  from_chain_id: number
  to_chain_id: number
  from_amount: string
  to_amount_gross: string
  to_amount_estimate: string
  to_amount_min: string
  fee_bps: number
  fee_amount: string
  tool_used: string | null
  liquidity_provider: string
  transfer_nonce: number
  expires_at: number
}

export interface SwapRequest {
  quote_id: string
  user_address: string
  input_nonce: number
  input_signature: string
}

export interface SwapResponse {
  swap_id: string
  status: string
  message: string
}

export interface SwapStatusResponse {
  swap_id: string
  status: string
  from_token_id: string
  to_token_id: string
  from_chain_id: number
  to_chain_id: number
  from_amount: string
  to_amount_estimate: string
  to_amount_actual: string | null
  approval_tx_hash: string | null
  swap_tx_hash: string | null
  error: string | null
  created_at: number
  updated_at: number
}

export interface TokenInfo {
  token_id: string
  token_type: number
  token_type_name: string
  chain_id: number | null
  chain_name: string | null
  token_address: string | null
  symbol: string | null
  decimals: number | null
  name: string | null
}

export interface TokenListResponse {
  tokens: TokenInfo[]
}

export interface ChainInfo {
  chain_id: number
  name: string
}

export interface ChainListResponse {
  chains: ChainInfo[]
}
