import { operationIdOf, type Operation, type OperationStage, type OperationStatus } from '@/api/operations'
import type {
  Activity,
  ActivityStatus,
  EarnActivity,
  SwapActivity,
} from '@/contexts/ActivityProvider/context'

type OperationFields = {
  status: ActivityStatus
  operationId?: string
  /** The services' own status, only while it says more than the badge. */
  serviceStatus?: OperationStatus
  /** Seconds. */
  createdAt: number
  /** Seconds, only once it differs from `createdAt`. */
  updatedAt?: number
  txHash?: string
  error?: string
}

export type SwapView = OperationFields &
  Pick<SwapActivity, 'fromToken' | 'toToken' | 'fromAmount'> & {
    type: 'swap'
    estimate: string
    received?: string
  }

export type EarnView = OperationFields &
  Pick<EarnActivity, 'direction' | 'token' | 'amount' | 'protocol'> & {
    type: 'earn'
    stages: OperationStage[]
  }

export type OperationView = SwapView | EarnView

/** One view of an operation: the services' row where it has one, the local activity otherwise. */
export const toOperationView = (activity: Activity, operation?: Operation): OperationView => {
  const fields: OperationFields = {
    status: activity.status,
    operationId: operationIdOf(activity),
    serviceStatus:
      operation && operation.status !== 'completed' && operation.status !== 'failed'
        ? operation.status
        : undefined,
    createdAt: operation?.created_at ?? Math.floor(activity.createdAt / 1000),
    updatedAt: operation && operation.updated_at !== operation.created_at ? operation.updated_at : undefined,
    txHash: operation?.tx_hash ?? activity.txHash,
    error: operation?.error ?? activity.error,
  }

  if (activity.type === 'swap') {
    return {
      ...fields,
      type: 'swap',
      fromToken: activity.fromToken,
      toToken: activity.toToken,
      fromAmount: activity.fromAmount,
      estimate: operation?.to_amount_estimate ?? activity.toAmount,
      received:
        operation?.to_amount_actual ?? (activity.status === 'completed' ? activity.toAmount : undefined),
    }
  }
  return {
    ...fields,
    type: 'earn',
    direction: activity.direction,
    token: activity.token,
    amount: activity.amount,
    protocol: activity.protocol,
    stages: operation?.stages ?? activity.stages ?? [],
  }
}
