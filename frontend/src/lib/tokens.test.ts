import { describe, expect, it } from 'vitest'
import {
  amountFiat,
  amountInputError,
  exceedsAmount,
  formatFiat,
  isPositiveAmount,
  mergeTokensBySymbol,
  parseAmount,
} from '@/lib/tokens'

describe('parseAmount', () => {
  it('reads an amount exactly into base units', () => {
    expect(parseAmount('1.5', 6)).toBe(1_500_000n)
    expect(parseAmount('.5', 6)).toBe(500_000n)
    expect(parseAmount('0.000000000000000001', 18)).toBe(1n)
  })

  it('reads thousands grouping, like a pasted displayed balance', () => {
    expect(parseAmount('1,234.5', 6)).toBe(1_234_500_000n)
  })

  it('refuses more decimals than the token has instead of rounding them away', () => {
    expect(parseAmount('1.1234567', 6)).toBeNull()
  })

  it('is null for missing or unparseable input', () => {
    expect(parseAmount('', 6)).toBeNull()
    expect(parseAmount('1', undefined)).toBeNull()
    expect(parseAmount('1,5', 6)).toBeNull()
  })
})

describe('amountFiat', () => {
  it('values a typed amount at the price', () => {
    expect(amountFiat('1.5', 6, 2)).toBe(3)
  })

  it('is undefined until the amount and the price can both be read', () => {
    expect(amountFiat('', 6, 2)).toBeUndefined()
    expect(amountFiat('1.1234567', 6, 2)).toBeUndefined()
    expect(amountFiat('1', 6, undefined)).toBeUndefined()
    expect(amountFiat('1', undefined, 2)).toBeUndefined()
  })
})

describe('amountInputError', () => {
  it('names the precision the token allows', () => {
    expect(amountInputError('1.1234567', 6)).toBe('Too many decimal places (max: 6)')
  })

  it('stays quiet for amounts the token can hold, and while typing', () => {
    expect(amountInputError('1.123456', 6)).toBeNull()
    expect(amountInputError('1.', 6)).toBeNull()
    expect(amountInputError('', 6)).toBeNull()
  })
})

describe('isPositiveAmount', () => {
  it('accepts a positive human-entered amount', () => {
    expect(isPositiveAmount('1', 6)).toBe(true)
    expect(isPositiveAmount('0.000001', 6)).toBe(true)
  })

  it('rejects zero and negative amounts', () => {
    expect(isPositiveAmount('0', 6)).toBe(false)
    expect(isPositiveAmount('-1', 6)).toBe(false)
  })

  it('rejects missing input', () => {
    expect(isPositiveAmount('', 6)).toBe(false)
    expect(isPositiveAmount('1', null)).toBe(false)
    expect(isPositiveAmount('1', undefined)).toBe(false)
  })

  it('rejects unparseable input instead of throwing', () => {
    expect(isPositiveAmount('abc', 6)).toBe(false)
    expect(isPositiveAmount('1.2.3', 6)).toBe(false)
  })
})

describe('exceedsAmount', () => {
  it('is true only strictly above the cap', () => {
    expect(exceedsAmount('1.5', 6, 1_500_000n)).toBe(false)
    expect(exceedsAmount('1.5', 6, 1_499_999n)).toBe(true)
    expect(exceedsAmount('1.499999', 6, 1_500_000n)).toBe(false)
  })

  it('is false for missing or unparseable input', () => {
    expect(exceedsAmount('', 6, 0n)).toBe(false)
    expect(exceedsAmount('1', null, 0n)).toBe(false)
    expect(exceedsAmount('abc', 6, 0n)).toBe(false)
  })
})

describe('mergeTokensBySymbol', () => {
  const tokens: Record<string, { symbol: string; name: string; decimals: number }> = {
    'usdc-6': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    'usdc-18': { symbol: 'USDC', name: 'USD Coin (bridged)', decimals: 18 },
    weth: { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
  }
  const getTokenById = (id: string) => tokens[id]

  it('sums amounts sharing a symbol and the same decimals', () => {
    const merged = mergeTokensBySymbol(
      [
        { tokenId: 'usdc-6', amount: '1000000' },
        { tokenId: 'usdc-6', amount: '2000000' },
      ],
      getTokenById,
    )
    expect(merged).toEqual([
      { symbol: 'USDC', name: 'USD Coin', amount: 3_000_000n, decimals: 6, fiat: undefined },
    ])
  })

  it('aligns mismatched decimals to the larger precision before adding', () => {
    // 1.0 USDC (6 decimals) + 2.0 USDC (18 decimals) = 3.0 at 18 decimals
    const merged = mergeTokensBySymbol(
      [
        { tokenId: 'usdc-6', amount: '1000000' },
        { tokenId: 'usdc-18', amount: '2000000000000000000' },
      ],
      getTokenById,
    )
    expect(merged).toHaveLength(1)
    expect(merged[0].amount).toBe(3_000_000_000_000_000_000n)
    expect(merged[0].decimals).toBe(18)
  })

  it('keeps different symbols as separate entries', () => {
    const merged = mergeTokensBySymbol(
      [
        { tokenId: 'usdc-6', amount: '1000000' },
        { tokenId: 'weth', amount: '1000000000000000000' },
      ],
      getTokenById,
    )
    expect(merged.map(m => m.symbol).sort()).toEqual(['USDC', 'WETH'])
  })

  it('skips zero, empty, and unknown-token entries', () => {
    const merged = mergeTokensBySymbol(
      [
        { tokenId: 'usdc-6', amount: '0' },
        { tokenId: 'usdc-6', amount: '' },
        { tokenId: 'unknown', amount: '1000000' },
      ],
      getTokenById,
    )
    expect(merged).toEqual([])
  })

  it('groups by an explicit symbol override', () => {
    const merged = mergeTokensBySymbol([{ tokenId: 'weth', amount: '5', symbol: 'ETH' }], getTokenById)
    expect(merged[0].symbol).toBe('ETH')
  })

  it('sums fiat when every constituent is priced', () => {
    const merged = mergeTokensBySymbol(
      [
        { tokenId: 'usdc-6', amount: '1000000' },
        { tokenId: 'usdc-18', amount: '2000000000000000000' },
      ],
      getTokenById,
      { 'usdc-6': 1, 'usdc-18': 1 },
    )
    expect(merged[0].fiat).toBe(3)
  })

  it('turns fiat undefined when any constituent lacks a price', () => {
    const merged = mergeTokensBySymbol(
      [
        { tokenId: 'usdc-6', amount: '1000000' },
        { tokenId: 'usdc-18', amount: '2000000000000000000' },
      ],
      getTokenById,
      { 'usdc-6': 1 },
    )
    expect(merged[0].fiat).toBeUndefined()
  })
})

describe('formatFiat', () => {
  it('formats as USD with two decimals', () => {
    expect(formatFiat(1234.5)).toBe('$1,234.50')
    expect(formatFiat(0)).toBe('$0.00')
    expect(formatFiat(-3.126)).toBe('-$3.13')
  })
})
