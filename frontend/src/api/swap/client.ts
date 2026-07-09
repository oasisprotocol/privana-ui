import type {
  ChainListResponse,
  HealthResponse,
  QuoteParams,
  QuoteResponse,
  SwapRequest,
  SwapResponse,
  TokenListResponse,
} from './types'

import { BASE_URL } from '../http'

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

export function getQuote(params: QuoteParams, signal?: AbortSignal) {
  const search = new URLSearchParams({
    from_token_id: params.fromTokenId,
    to_token_id: params.toTokenId,
    from_amount: params.fromAmount,
    user_address: params.userAddress,
  })
  if (params.slippage !== undefined) {
    search.set('slippage', String(params.slippage))
  }
  return request<QuoteResponse>(`/v1/quote?${search}`, { signal })
}

export function executeSwap(body: SwapRequest) {
  return request<SwapResponse>('/v1/swap', {
    method: 'POST',
    body: JSON.stringify(body),
  })
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
