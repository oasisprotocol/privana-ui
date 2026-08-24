import { BaseError, UserRejectedRequestError } from 'viem'
import { describe, expect, it } from 'vitest'
import { extractErrorMessage } from '@/lib/errors'

describe('extractErrorMessage', () => {
  it('returns the short message of a viem BaseError', () => {
    expect(extractErrorMessage(new BaseError('Nonce too low.'))).toBe('Nonce too low.')
  })

  it('maps a user rejection to a friendly message', () => {
    const rejection = new UserRejectedRequestError(new Error('User rejected the request.'))
    expect(extractErrorMessage(rejection)).toBe('Transaction rejected')
  })

  it('finds a user rejection anywhere in the cause chain', () => {
    const rejection = new UserRejectedRequestError(new Error('User rejected the request.'))
    const wrapped = new BaseError('Request failed.', { cause: rejection })
    expect(extractErrorMessage(wrapped)).toBe('Transaction rejected')
  })

  it('returns the message of a plain Error', () => {
    expect(extractErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('falls back for non-Error values', () => {
    expect(extractErrorMessage('a string')).toBe('Something went wrong')
    expect(extractErrorMessage(undefined)).toBe('Something went wrong')
    expect(extractErrorMessage(null, 'Custom fallback')).toBe('Custom fallback')
  })
})
