import { describe, expect, it } from 'vitest'
import { describeFailure } from './failureCopy'

describe('describeFailure', () => {
  it('explains a consumed user nonce as a pending operation and points at activity', () => {
    const expected = 'Another operation was still pending — check your activity before retrying'
    expect(describeFailure('Transaction reverted: InvalidNonce')).toBe(expected)
    expect(describeFailure('Invalid input nonce')).toBe(expected)
  })

  it("leaves services' generic nonce wording alone — it may be the service's own nonce", () => {
    expect(describeFailure('Transaction nonce conflict')).toBe('Transaction nonce conflict')
  })

  it('hides the RPC endpoint behind a rate-limit failure', () => {
    expect(describeFailure('429 Client Error: Too Many Requests for url: https://sapphire.oasis.io/')).toBe(
      'The network was busy — try again',
    )
  })

  it('passes readable backend sentences through untouched', () => {
    expect(describeFailure('Quote has expired')).toBe('Quote has expired')
    expect(describeFailure('Submission outcome unknown; manual recovery required')).toBe(
      'Submission outcome unknown; manual recovery required',
    )
  })
})
