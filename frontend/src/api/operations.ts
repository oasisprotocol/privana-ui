import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import type { Activity } from '@/contexts/ActivityProvider/context'
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

const serverIdOf = (a: Activity): string | undefined =>
  a.type === 'swap' ? a.swapId : a.direction === 'deposit' ? a.depositId : a.withdrawId

// The server row for a local entry: by operation id, or — when the submit
// response never arrived and the id is unknown — by what the client signed:
// the quote id for a swap; pool, amount and nonce for an earn move. A refused
// earn request leaves its nonce unspent for the next one, so the nonce alone
// is not unique and the newest row with the full identity wins.
export function serverOperationFor(a: Activity, operations: readonly Operation[]): Operation | undefined {
  const sid = serverIdOf(a)
  if (sid != null) {
    const byId = operations.find(o => o.operation_id === sid)
    if (byId) return byId
  }
  if (a.type === 'swap') {
    return a.quoteId != null
      ? operations.find(o => o.operation_type === 'swap' && o.quote_id === a.quoteId)
      : undefined
  }
  if (a.nonce == null) return undefined
  const type = a.direction === 'deposit' ? 'earn_deposit' : 'earn_withdraw'
  return operations
    .filter(
      o =>
        o.operation_type === type && o.pool_id === a.poolId && o.amount === a.amount && o.nonce === a.nonce,
    )
    .sort((x, y) => y.created_at - x.created_at)[0]
}

// Still worth polling for: an operation the server has in flight, or a local
// entry the server has not listed yet. A listed entry follows its server row,
// so its own (never-updated) local status does not keep the poll alive.
export const hasUnresolved = (operations: readonly Operation[], activities: readonly Activity[]): boolean =>
  operations.some(o => isInFlight(o.status)) ||
  activities.some(a => a.status === 'in-progress' && !serverOperationFor(a, operations))

export const operationsKeys = {
  all: ['operations'] as const,
  list: (userAddress: string) => [...operationsKeys.all, 'list', userAddress] as const,
}

// `activities` are the local entries; one the server has not listed yet keeps
// the poll alive so it is adopted as soon as its row exists.
export function useOperations(activities: readonly Activity[] = []) {
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
      hasUnresolved(query.state.data?.operations ?? [], activities) ? 10_000 : false,
    staleTime: 5_000,
  })
}
