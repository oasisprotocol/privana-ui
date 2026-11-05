import { describe, expect, it } from 'vitest'
import { AccountingApiError } from '@oasisprotocol/privana-sdk'
import { transferFailure } from './transferFailure'

const apiError = (statusCode: number, detail: string) =>
  new AccountingApiError('API request failed', statusCode, detail)

describe('transferFailure', () => {
  it('explains the rate limit', () => {
    expect(transferFailure(apiError(429, 'Too many transfer requests. Please retry later.'))).toBe(
      "You've sent too many transfers. Try again later.",
    )
  })

  it('explains a failed session check', () => {
    expect(transferFailure(apiError(401, 'Invalid or expired bearer token'))).toBe(
      "Couldn't verify your session. Try again, or sign out and back in if it keeps failing.",
    )
  })

  it('maps other API errors through the shared failure copy', () => {
    expect(transferFailure(apiError(400, 'Transfer nonce mismatch: got 1, expected 2'))).toBe(
      'Another operation was still pending — check your activity before retrying',
    )
  })
})
