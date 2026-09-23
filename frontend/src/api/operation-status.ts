export type OperationStatus =
  'scheduled' | 'executing' | 'pending' | 'refunding' | 'undeployed' | 'completed' | 'failed' | 'canceled'

// Failed/canceled are the only settled-bad statuses; completed is settled-good;
// everything else is still in flight (swaps: scheduled/executing/refunding,
// earn: pending, undeployed awaiting redeploy). Unknown future statuses
// default to in-flight rather than failed.
export const isSettledFailure = (status: OperationStatus): boolean =>
  status === 'failed' || status === 'canceled'

export const isInFlight = (status: OperationStatus): boolean =>
  status !== 'completed' && !isSettledFailure(status)
