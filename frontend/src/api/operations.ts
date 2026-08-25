import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { request } from './http'

// Pending/failed swap + earn operations, served by service from its own
// DB (swaps + earn_transactions). Completed history lives on-chain in Accounting
// (SDK `useHistory`); these two sets are disjoint by status - an op leaves this
// list once it settles and shows up in history instead. The exception is
// "undeployed": the accounting transfer settled (a history entry exists) but
// the funds still await operator redeploy into the strategy, so the op stays
// listed here at the same time.
export type UnsettledOperationType = 'swap' | 'earn_deposit' | 'earn_withdraw'
export type UnsettledOperationStatus = 'pending' | 'failed' | 'canceled' | 'undeployed'

export interface UnsettledOperation {
  operation_id: string
  operation_type: UnsettledOperationType
  status: UnsettledOperationStatus
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
}

export interface UnsettledOperationsResponse {
  operations: UnsettledOperation[]
}

const UNSETTLED_LIMIT = 100

export function getUnsettledOperations(jwt: string, limit = UNSETTLED_LIMIT) {
  return request<UnsettledOperationsResponse>(`/v1/operations/unsettled?limit=${limit}`, undefined, jwt)
}

export const operationsKeys = {
  all: ['operations'] as const,
  unsettled: (userAddress: string) => [...operationsKeys.all, 'unsettled', userAddress] as const,
}

export function useUnsettledOperations() {
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
    queryKey: operationsKeys.unsettled(address ?? ''),
    queryFn: () => getUnsettledOperations(jwt!),
    enabled: !!address && !!jwt,
    // Poll while any non-terminal op exists: "pending" resolves on its own and
    // "undeployed" settles when the operator redeploys — without polling a
    // session would never observe either transition.
    refetchInterval: query =>
      query.state.data?.operations.some(o => o.status === 'pending' || o.status === 'undeployed')
        ? 10_000
        : false,
    staleTime: 5_000,
  })
}
