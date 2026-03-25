import { useMutation, useQuery } from '@tanstack/react-query'

import { executeSwap, getChains, getQuote, getSwapStatus, getTokens } from './client'
import type { QuoteParams, SwapRequest } from './types'

export const swapKeys = {
  all: ['swap'] as const,
  quote: (params: QuoteParams) => [...swapKeys.all, 'quote', params] as const,
  status: (swapId: string) => [...swapKeys.all, 'status', swapId] as const,
  tokens: () => [...swapKeys.all, 'tokens'] as const,
  chains: () => [...swapKeys.all, 'chains'] as const,
}

export function useQuote(params: QuoteParams, enabled = true) {
  return useQuery({
    queryKey: swapKeys.quote(params),
    queryFn: () => getQuote(params),
    enabled,
    staleTime: 30_000,
  })
}

export function useExecuteSwap() {
  return useMutation({
    mutationFn: (body: SwapRequest) => executeSwap(body),
  })
}

export function useSwapStatus(swapId: string, enabled = true) {
  return useQuery({
    queryKey: swapKeys.status(swapId),
    queryFn: () => getSwapStatus(swapId),
    enabled,
    refetchInterval: 5_000,
  })
}

export function useTokens() {
  return useQuery({
    queryKey: swapKeys.tokens(),
    queryFn: getTokens,
    staleTime: 60_000,
  })
}

export function useChains() {
  return useQuery({
    queryKey: swapKeys.chains(),
    queryFn: getChains,
    staleTime: 60_000,
  })
}
