export type UnsettledOperationStatus =
  'scheduled' | 'executing' | 'pending' | 'refunding' | 'failed' | 'canceled' | 'undeployed'

// Failed/canceled are the feed's only settled-bad statuses; everything else it
// serves is still in flight (swaps: scheduled/executing/refunding, earn:
// pending, undeployed awaiting redeploy). Unknown future statuses default to
// in-flight rather than failed.
export const isSettledFailure = (status: UnsettledOperationStatus): boolean =>
  status === 'failed' || status === 'canceled'
