import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { request } from './http'
import { isInFlight } from './operation-status'

// Every swap and earn operation services has recorded for the user, in any
// status, newest first. Services submits these transactions itself, so this is
// the source of truth for them; accounting history only shows their legs.
export type OperationType = 'swap' | 'earn_deposit' | 'earn_withdraw'
export { isInFlight, isSettledFailure, type OperationStatus } from './operation-status'
import type { OperationStatus } from './operation-status'

export interface Operation {
  operation_id: string
  operation_type: OperationType
  status: OperationStatus
  created_at: number
  updated_at: number
  tx_hash: string | null
  error: string | null
  // Swap-only fields
  quote_id: string | null
  from_token_id: string | null
  to_token_id: string | null
  from_amount: string | null
  to_amount_estimate: string | null
  to_amount_actual: string | null
  // Earn-only fields
  pool_id: string | null
  token_id: string | null
  amount: string | null
  // The nonce the user signed with: the one key the client holds before it
  // has learned the operation id (e.g. the submit response was lost).
  nonce: string | null
}

export interface OperationsResponse {
  operations: Operation[]
  next_cursor: string | null
}

const OPERATIONS_PAGE_SIZE = 100

export function getOperations(jwt: string, limit = OPERATIONS_PAGE_SIZE, before?: string) {
  const search = new URLSearchParams({ limit: String(limit) })
  if (before) search.set('before', before)
  return request<OperationsResponse>(`/v1/operations?${search}`, undefined, jwt)
}

export const operationsKeys = {
  all: ['operations'] as const,
  list: (userAddress: string) => [...operationsKeys.all, 'list', userAddress] as const,
}

// `hasLocalPending` keeps the poll alive for an operation the server has not
// listed yet, so the optimistic entry is adopted as soon as the row exists.
export function useOperations(hasLocalPending = false) {
  const { session, accessToken } = useSiweAuth()
  const address = session?.address
  const jwt = accessToken
  const queryClient = useQueryClient()

  const hadJwtRef = useRef(false)
  useEffect(() => {
    if (hadJwtRef.current && !jwt) {
      queryClient.removeQueries({ queryKey: operationsKeys.all })
    }
    hadJwtRef.current = !!jwt
  }, [jwt, queryClient])

  return useQuery({
    queryKey: operationsKeys.list(address ?? ''),
    queryFn: () => getOperations(jwt!),
    enabled: !!address && !!jwt,
    refetchInterval: query =>
      hasLocalPending || query.state.data?.operations.some(o => isInFlight(o.status)) ? 10_000 : false,
    staleTime: 5_000,
  })
}
