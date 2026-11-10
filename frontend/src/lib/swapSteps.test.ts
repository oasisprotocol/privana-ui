import { describe, expect, it } from 'vitest'
import type { SwapStep } from '@/api/operations'
import { swapStepLabel } from './swapSteps'

describe('swapStepLabel', () => {
  it('describes what a swap in progress is doing', () => {
    expect(swapStepLabel('execute:funding')).toBe('Waiting for funds to arrive')
    expect(swapStepLabel('execute:bridging')).toBe('Bridging')
    expect(swapStepLabel('refund:payout')).toBe('Returning your funds')
  })

  it('has no line for a failed, missing or unknown step', () => {
    expect(swapStepLabel('parked')).toBeUndefined()
    expect(swapStepLabel('no_funds_moved')).toBeUndefined()
    expect(swapStepLabel(null)).toBeUndefined()
    expect(swapStepLabel('later:step' as SwapStep)).toBeUndefined()
  })
})
