export type OperationStatus =
  | 'scheduled'
  | 'executing'
  | 'pending'
  | 'refunding'
  | 'undeployed'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'refunded'

// Failed, canceled and refunded (a LiFi swap whose input was returned) are the
// settled-bad statuses; completed is settled-good; everything else is still in
// flight (swaps: scheduled/executing/refunding, earn: pending, undeployed
// awaiting redeploy). Unknown future statuses default to in-flight.
export const isSettledFailure = (status: OperationStatus): boolean =>
  status === 'failed' || status === 'canceled' || status === 'refunded'

export const isInFlight = (status: OperationStatus): boolean =>
  status !== 'completed' && !isSettledFailure(status)
