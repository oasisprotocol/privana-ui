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

// A 4xx means the backend received the request and refused it — the operation
// definitively did not happen. Timeouts, network errors, and 5xx leave the
// outcome unknown: the backend may still be processing (or have completed)
// the operation after the client gave up.
export const isDefinitiveRejection = (err: unknown): boolean => {
  const status = httpStatusOf(err)
  return status !== undefined && status >= 400 && status < 500
}

// 409: the backend refused to queue the request because an earlier operation
// still holds the user's nonce. Nothing was recorded server-side.
export const isOperationPending = (err: unknown): boolean => httpStatusOf(err) === 409

export const OPERATION_PENDING_MESSAGE =
  'Your previous operation is still being processed — try again in a moment'

export const extractErrorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  if (err instanceof BaseError) {
    if (err.walk(e => e instanceof UserRejectedRequestError)) return 'Transaction rejected'
    return err.shortMessage
  }
  if (err instanceof Error) return err.message
  return fallback
}
