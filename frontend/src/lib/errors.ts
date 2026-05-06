import { BaseError, UserRejectedRequestError } from 'viem'

export const extractErrorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  if (err instanceof BaseError) {
    if (err.walk(e => e instanceof UserRejectedRequestError)) return 'Transaction rejected'
    return err.shortMessage
  }
  if (err instanceof Error) return err.message
  return fallback
}
