import { useQuery } from '@tanstack/react-query'

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

export type EarnPoolStatus = 'active' | 'paused' | 'closed'

export interface EarnPool {
  pool_id: string
  token_id: string
  strategy: string
  total_assets: string
  apy_bps: number
  status: EarnPoolStatus
}

export interface EarnPoolListResponse {
  pools: EarnPool[]
}

export interface DepositQuoteParams {
  poolId: string
  amount: string
  userAddress: string
}

export interface DepositQuoteResponse {
  quote_id: string
  pool_id: string
  token_id: string
  amount: string
  shares_estimate: string
  exchange_rate: string
  pool_address: string
  transfer_nonce: number
  expires_at: number
}

export interface DepositRequest {
  pool_id: string
  user_address: string
  amount: string
  nonce: number
  signature: string
}

export interface DepositResponse {
  deposit_id: string
  pool_id: string
  amount: string
  shares_minted: string | null
  exchange_rate: string | null
  tx_hash: string | null
  status: string
}

export interface EarnBalance {
  pool_id: string
  token_id: string
  shares: string
  underlying_amount: string
  exchange_rate: string
}

export interface EarnBalanceListResponse {
  positions: EarnBalance[]
}

export const earnKeys = {
  all: ['earn'] as const,
  pools: () => [...earnKeys.all, 'pools'] as const,
  balance: (userAddress: string) => [...earnKeys.all, 'balance', userAddress] as const,
}

export function getEarnPools() {
  return request<EarnPoolListResponse>('/v1/earn/pools')
}

export function getDepositQuote(params: DepositQuoteParams, signal?: AbortSignal) {
  const search = new URLSearchParams({
    pool_id: params.poolId,
    amount: params.amount,
    user_address: params.userAddress,
  })
  return request<DepositQuoteResponse>(`/v1/earn/quote?${search}`, { signal })
}

export function depositEarn(body: DepositRequest) {
  return request<DepositResponse>('/v1/earn/deposit', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getEarnBalance(userAddress: string) {
  const search = new URLSearchParams({ user_address: userAddress })
  return request<EarnBalanceListResponse>(`/v1/earn/balance?${search}`)
}

export function useEarnPools() {
  return useQuery({
    queryKey: earnKeys.pools(),
    queryFn: getEarnPools,
    staleTime: 30_000,
  })
}

export function useEarnBalance(userAddress: string | undefined) {
  return useQuery({
    queryKey: earnKeys.balance(userAddress ?? ''),
    queryFn: () => getEarnBalance(userAddress!),
    enabled: !!userAddress,
    staleTime: 30_000,
  })
}
