import { describe, expect, it } from 'vitest'
import { computeEarnChange24h } from './earn'

// Base units → fiat at a fixed per-token price, 6 decimals everywhere.
const PRICES: Record<string, number> = { '0xusdc': 1, '0xweth': 2 }
const fiatOf = (tokenId: string, amount: string) => (Number(amount) / 1e6) * (PRICES[tokenId] ?? 0)

const position = (overrides: Partial<Parameters<typeof computeEarnChange24h>[0][number]> = {}) => ({
  token_id: '0xusdc',
  shares: '1000000',
  underlying_amount: '1008000',
  change_24h: '8000' as string | null,
  ...overrides,
})

describe('computeEarnChange24h', () => {
  it('reports the change and its percent of the window-start value', () => {
    const change = computeEarnChange24h([position()], fiatOf)
    // Window start = 1008000 − 8000 = 1000000 base units, so 8000 is +0.8%.
    expect(change?.usd).toBeCloseTo(0.008)
    expect(change?.pct).toBeCloseTo(0.8)
  })

  it('weights the aggregate percent by fiat value, not by averaging per-position percents', () => {
    const change = computeEarnChange24h(
      [
        // +1% on $1 of USDC…
        position({ underlying_amount: '1010000', change_24h: '10000' }),
        // …and +3% on $2 of WETH (price 2). Averaging percents would say 2%;
        // the fiat-weighted move is 0.07 / 3.00 ≈ 2.33%.
        position({ token_id: '0xweth', underlying_amount: '1030000', change_24h: '30000' }),
      ],
      fiatOf,
    )
    expect(change?.usd).toBeCloseTo(0.07)
    expect(change?.pct).toBeCloseTo((0.07 / 3) * 100)
  })

  it('returns null when any live position has no change, never a partial sum', () => {
    expect(computeEarnChange24h([position(), position({ change_24h: null })], fiatOf)).toBeNull()
  })

  it('ignores zero-share positions entirely', () => {
    // An exited position with an unknown change must not hide everyone else's badge.
    const change = computeEarnChange24h(
      [position(), position({ shares: '0', underlying_amount: '0', change_24h: null })],
      fiatOf,
    )
    expect(change?.pct).toBeCloseTo(0.8)
    expect(computeEarnChange24h([position({ shares: '0' })], fiatOf)).toBeNull()
  })

  it('returns null on a zero window-start value instead of dividing by it', () => {
    expect(
      computeEarnChange24h([position({ underlying_amount: '8000', change_24h: '8000' })], fiatOf),
    ).toBeNull()
  })

  it('keeps the sign of a negative day', () => {
    const change = computeEarnChange24h(
      [position({ underlying_amount: '992000', change_24h: '-8000' })],
      fiatOf,
    )
    expect(change?.usd).toBeCloseTo(-0.008)
    expect(change?.pct).toBeCloseTo(-0.8)
  })
})
