import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { request } from './http'

export { ApiError } from './http'

export type EarnPoolStatus = 'active' | 'paused' | 'closed'

export interface EarnPool {
  pool_id: string
  token_id: string
  strategy: string
  total_assets: string
  apy_bps: number
  status: EarnPoolStatus
  pool_address: string
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

export interface WithdrawRequest {
  pool_id: string
  user_address: string
  amount: string
  nonce: number
  signature: string
}

export interface WithdrawNonceResponse {
  user_address: string
  nonce: number
}

export interface WithdrawResponse {
  withdraw_id: string
  pool_id: string
  amount: string
  shares_burned: string | null
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

export interface ApyHistoryPoint {
  timestamp: number
  apy_bps: number
}

export interface ApyHistoryResponse {
  pool_id: string
  points: ApyHistoryPoint[]
}

export const earnKeys = {
  all: ['earn'] as const,
  pools: () => [...earnKeys.all, 'pools'] as const,
  balance: (userAddress: string) => [...earnKeys.all, 'balance', userAddress] as const,
  apyHistory: (poolId: string, days: number) => [...earnKeys.all, 'apy-history', poolId, days] as const,
}

export function getEarnPools() {
  return request<EarnPoolListResponse>('/v1/earn/pools')
}

export function getApyHistory(poolId: string, days?: number) {
  const search = days != null ? `?days=${days}` : ''
  return request<ApyHistoryResponse>(`/v1/earn/pools/${poolId}/apy-history${search}`)
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

export function withdrawEarn(body: WithdrawRequest) {
  return request<WithdrawResponse>('/v1/earn/withdraw', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getWithdrawNonce(jwt: string) {
  return request<WithdrawNonceResponse>('/v1/earn/withdraw/nonce', undefined, jwt)
}

export function getEarnBalance(jwt: string) {
  return request<EarnBalanceListResponse>('/v1/earn/balance', undefined, jwt)
}

export function useEarnPools() {
  return useQuery({
    queryKey: earnKeys.pools(),
    queryFn: getEarnPools,
    staleTime: 30_000,
  })
}

export function useApyHistory(poolId: string, days = 30) {
  return useQuery({
    queryKey: earnKeys.apyHistory(poolId, days),
    queryFn: () => getApyHistory(poolId, days),
    staleTime: 60 * 60 * 1000,
    enabled: !!poolId,
  })
}

export function useEarnBalance() {
  const { session, accessToken } = useSiweAuth()
  // Key the cache off the authenticated address so the queryKey and queryFn
  // always agree on which identity the request is for. Using wagmi's address
  // would race during wallet switches (the token can rotate before useAccount
  // propagates).
  const address = session?.address
  const jwt = accessToken
  const queryClient = useQueryClient()

  // Drop cached balances when the auth session goes away so a logout doesn't
  // briefly flash the previous user's data on the next sign-in.
  const hadJwtRef = useRef(false)
  useEffect(() => {
    if (hadJwtRef.current && !jwt) {
      queryClient.removeQueries({ queryKey: [...earnKeys.all, 'balance'] })
    }
    hadJwtRef.current = !!jwt
  }, [jwt, queryClient])

  return useQuery({
    queryKey: earnKeys.balance(address ?? ''),
    queryFn: () => getEarnBalance(jwt!),
    enabled: !!address && !!jwt,
    staleTime: 30_000,
  })
}
