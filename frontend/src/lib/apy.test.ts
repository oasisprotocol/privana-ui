import { describe, expect, it } from 'vitest'
import { apyBpsToFraction, formatApyBps } from '@/lib/apy'

describe('apyBpsToFraction', () => {
  it('converts basis points to a fraction', () => {
    expect(apyBpsToFraction(500)).toBe(0.05)
    expect(apyBpsToFraction(10_000)).toBe(1)
    expect(apyBpsToFraction(1)).toBe(0.0001)
  })

  it('handles zero and negative values', () => {
    expect(apyBpsToFraction(0)).toBe(0)
    expect(apyBpsToFraction(-250)).toBe(-0.025)
  })
})

describe('formatApyBps', () => {
  it('formats basis points as a two-decimal percentage', () => {
    expect(formatApyBps(500)).toBe('5.00%')
    expect(formatApyBps(512)).toBe('5.12%')
    expect(formatApyBps(0)).toBe('0.00%')
  })

  it('adds a plus sign only for positive values when signed', () => {
    expect(formatApyBps(500, { signed: true })).toBe('+5.00%')
    expect(formatApyBps(0, { signed: true })).toBe('0.00%')
    expect(formatApyBps(-250, { signed: true })).toBe('-2.50%')
  })
})
