import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { ApiError, request } from './http'

export interface PortfolioHistoryPoint {
  timestamp: number
  total_usd: string
  available_usd: string
  locked_usd: string
  earn_usd: string
}

export interface PortfolioHistoryResponse {
  // Oldest first, closed on "now". Empty when the user has no history.
  points: PortfolioHistoryPoint[]
}

export interface EarnHistoryPoint {
  timestamp: number
  value_usd: string
}

export interface EarnHistoryResponse {
  points: EarnHistoryPoint[]
}

export const historyKeys = {
  all: ['history'] as const,
  portfolio: (address: string, days: number | undefined) =>
    [...historyKeys.all, 'portfolio', address, days ?? 'all'] as const,
  earn: (address: string, days: number | undefined) =>
    [...historyKeys.all, 'earn', address, days ?? 'all'] as const,
}

// Omitting `days` asks for everything since the user's first activity ("All"),
// which avoids a flat leading edge on accounts younger than a fixed range.
export function getPortfolioHistory(jwt: string, days?: number) {
  const search = days != null ? `?days=${days}` : ''
  return request<PortfolioHistoryResponse>(`/v1/portfolio/history${search}`, undefined, jwt)
}

export function getEarnHistory(jwt: string, days?: number) {
  const search = days != null ? `?days=${days}` : ''
  return request<EarnHistoryResponse>(`/v1/earn/history${search}`, undefined, jwt)
}

// Same auth/keying rules as useEarnBalance: key the cache off the authenticated
// address (not wagmi's, which races during wallet switches) and drop cached
// series on logout so the next sign-in never flashes the previous user's chart.
function useHistoryQuery<T>(queryKey: readonly unknown[], fetch: (jwt: string) => Promise<T>) {
  const { session, accessToken } = useSiweAuth()
  const address = session?.address
  const queryClient = useQueryClient()

  const hadJwtRef = useRef(false)
  useEffect(() => {
    if (hadJwtRef.current && !accessToken) {
      queryClient.removeQueries({ queryKey: historyKeys.all })
    }
    hadJwtRef.current = !!accessToken
  }, [accessToken, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => fetch(accessToken!),
    enabled: !!address && !!accessToken,
    staleTime: 5 * 60_000,
    // 4xx answers (auth expiry, endpoint not deployed) won't change on retry.
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status < 500) && failureCount < 3,
  })
}

export function usePortfolioHistory(days?: number) {
  const { session } = useSiweAuth()
  return useHistoryQuery(historyKeys.portfolio(session?.address ?? '', days), jwt =>
    getPortfolioHistory(jwt, days),
  )
}

export function useEarnHistory(days?: number) {
  const { session } = useSiweAuth()
  return useHistoryQuery(historyKeys.earn(session?.address ?? '', days), jwt => getEarnHistory(jwt, days))
}
