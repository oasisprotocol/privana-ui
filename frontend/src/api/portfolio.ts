import { useEffect, useMemo, useRef } from 'react'
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

export type ChartRange = 'day' | 'week' | 'month' | 'year' | 'all'

export const CHART_RANGE_DAYS: Record<ChartRange, number | undefined> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
  all: undefined,
}

const DAY_SEC = 86_400

// Longest range the backend serves at 6 h resolution; day/week/month are sliced from it.
export const FINE_SERIES_DAYS = 90

const RANGE_SOURCE_DAYS: Record<ChartRange, number | undefined> = {
  day: FINE_SERIES_DAYS,
  week: FINE_SERIES_DAYS,
  month: FINE_SERIES_DAYS,
  year: undefined,
  all: undefined,
}

export function sliceRange<T extends { timestamp: number }>(points: readonly T[], range: ChartRange): T[] {
  const days = CHART_RANGE_DAYS[range]
  if (days == null || points.length === 0) return [...points]
  const cutoff = points[points.length - 1].timestamp - days * DAY_SEC
  const first = points.findIndex(p => p.timestamp >= cutoff)
  if (first === -1) return []
  return points.slice(Math.max(first - 1, 0))
}

export function endSeriesAt<T extends { value: number }>(points: T[], liveValue: number | undefined): T[] {
  if (liveValue == null || points.length === 0) return points
  return [...points.slice(0, -1), { ...points[points.length - 1], value: liveValue }]
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
    placeholderData: (previousData, previousQuery) =>
      previousQuery && previousQuery.queryKey[2] === address ? previousData : undefined,
    staleTime: 5 * 60_000,
    // 4xx answers (auth expiry, endpoint not deployed) won't change on retry.
    retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 3,
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

type ChartSeries<T> = { points: T[]; isLoading: boolean }

function useChartSeries<T extends { timestamp: number }>(
  range: ChartRange,
  fine: { data?: { points: T[] }; isLoading: boolean },
  all: { data?: { points: T[] }; isLoading: boolean },
): ChartSeries<T> {
  const source = RANGE_SOURCE_DAYS[range] === FINE_SERIES_DAYS ? fine : all
  const sourcePoints = source.data?.points
  const points = useMemo(() => sliceRange(sourcePoints ?? [], range), [sourcePoints, range])
  return { points, isLoading: source.isLoading }
}

export function usePortfolioChart(range: ChartRange): ChartSeries<PortfolioHistoryPoint> {
  return useChartSeries(range, usePortfolioHistory(FINE_SERIES_DAYS), usePortfolioHistory())
}

export function useEarnChart(range: ChartRange): ChartSeries<EarnHistoryPoint> {
  return useChartSeries(range, useEarnHistory(FINE_SERIES_DAYS), useEarnHistory())
}
