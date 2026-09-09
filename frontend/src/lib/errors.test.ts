import { BaseError, UserRejectedRequestError } from 'viem'
import { describe, expect, it } from 'vitest'
import { extractErrorMessage, isDefinitiveRejection, shouldRetryQuery } from '@/lib/errors'

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

describe('shouldRetryQuery', () => {
  const withStatus = (props: object) => Object.assign(new Error('failed'), props)

  it('never retries 4xx from the SDK (statusCode)', () => {
    expect(shouldRetryQuery(0, withStatus({ statusCode: 401 }))).toBe(false)
    expect(shouldRetryQuery(0, withStatus({ statusCode: 404 }))).toBe(false)
    expect(shouldRetryQuery(0, withStatus({ statusCode: 429 }))).toBe(false)
  })

  it('never retries 4xx from the services client (status)', () => {
    expect(shouldRetryQuery(0, withStatus({ status: 422 }))).toBe(false)
  })

  it('retries 5xx at most twice', () => {
    const err = withStatus({ statusCode: 500 })
    expect(shouldRetryQuery(0, err)).toBe(true)
    expect(shouldRetryQuery(1, err)).toBe(true)
    expect(shouldRetryQuery(2, err)).toBe(false)
  })

  it('retries statusless errors (network failures) at most twice', () => {
    expect(shouldRetryQuery(0, new Error('fetch failed'))).toBe(true)
    expect(shouldRetryQuery(2, new Error('fetch failed'))).toBe(false)
    expect(shouldRetryQuery(0, undefined)).toBe(true)
  })
})

describe('isDefinitiveRejection', () => {
  const withStatus = (props: object) => Object.assign(new Error('failed'), props)

  it('is true for 4xx from either API error shape', () => {
    expect(isDefinitiveRejection(withStatus({ statusCode: 400 }))).toBe(true)
    expect(isDefinitiveRejection(withStatus({ status: 422 }))).toBe(true)
  })

  it('is false when the outcome is unknown (5xx, network, timeout)', () => {
    expect(isDefinitiveRejection(withStatus({ statusCode: 500 }))).toBe(false)
    expect(isDefinitiveRejection(withStatus({ status: 504 }))).toBe(false)
    expect(isDefinitiveRejection(new TypeError('Failed to fetch'))).toBe(false)
    expect(isDefinitiveRejection(new DOMException('The operation timed out', 'TimeoutError'))).toBe(false)
    expect(isDefinitiveRejection(undefined)).toBe(false)
  })
})
