import { AccountingApiError } from '@oasisprotocol/privana-sdk'
import { extractErrorMessage } from '@/lib/errors'
import { describeFailure } from '@/pages/Activity/failureCopy'

export const transferFailure = (err: unknown): string => {
  if (!(err instanceof AccountingApiError)) return extractErrorMessage(err, 'Transfer failed')
  if (err.statusCode === 429) return "You've sent too many transfers. Try again later."
  if (err.statusCode === 401)
    return "Couldn't verify your session. Try again, or sign out and back in if it keeps failing."
  return describeFailure(err.detail ?? err.message)
}
