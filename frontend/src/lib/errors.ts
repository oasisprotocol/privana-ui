import { BaseError, UserRejectedRequestError } from 'viem'

// Covers both API error shapes: the SDK's AccountingApiError (statusCode) and
// the services client's ApiError (status).
const httpStatusOf = (err: unknown): number | undefined => {
  if (!err || typeof err !== 'object') return undefined
  const { statusCode, status } = err as { statusCode?: unknown; status?: unknown }
  if (typeof statusCode === 'number') return statusCode
  if (typeof status === 'number') return status
  return undefined
}

// Global react-query retry policy: a 4xx answer won't change on retry (429
// included — an immediate retry hammers a backend that just said it's over
// quota, and the polling hooks refire soon anyway), and retrying 5xx more
// than twice mostly amplifies load on an already struggling backend.
export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  const status = httpStatusOf(error)
  if (status !== undefined && status < 500) return false
  return failureCount < 2
}

export const extractErrorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  if (err instanceof BaseError) {
    if (err.walk(e => e instanceof UserRejectedRequestError)) return 'Transaction rejected'
    return err.shortMessage
  }
  if (err instanceof Error) return err.message
  return fallback
}
