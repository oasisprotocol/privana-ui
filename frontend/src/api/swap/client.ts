import type {
  ChainListResponse,
  HealthResponse,
  QuoteParams,
  QuoteResponse,
  SwapRequest,
  SwapResponse,
  SwapStatusResponse,
  TokenListResponse,
} from './types'

const BASE_URL = import.meta.env.VITE_SWAP_API_URL ?? 'http://localhost:8001'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

export function getQuote(params: QuoteParams) {
  const search = new URLSearchParams({
    from_token_id: params.fromTokenId,
    to_token_id: params.toTokenId,
    from_amount: params.fromAmount,
    user_address: params.userAddress,
  })
  if (params.slippage !== undefined) {
    search.set('slippage', String(params.slippage))
  }
  return request<QuoteResponse>(`/v1/quote?${search}`)
}

export function executeSwap(body: SwapRequest) {
  return request<SwapResponse>('/v1/swap', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getSwapStatus(swapId: string) {
  return request<SwapStatusResponse>(`/v1/swap/${swapId}/status`)
}

export function getTokens() {
  return request<TokenListResponse>('/v1/tokens')
}

export function getChains() {
  return request<ChainListResponse>('/v1/chains')
}

export function getHealth() {
  return request<HealthResponse>('/health')
}
