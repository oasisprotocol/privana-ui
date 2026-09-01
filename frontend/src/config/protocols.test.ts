import { describe, expect, it } from 'vitest'
import { getProtocolLabel, venueForStrategy } from '@/config/protocols'

describe('getProtocolLabel', () => {
  it('maps backend strategy keys to display labels', () => {
    expect(getProtocolLabel('aave-v3')).toBe('Aave')
    expect(getProtocolLabel('midas-mtbill')).toBe('Midas')
  })

  it('matches on the family prefix, tolerating labels and variants', () => {
    expect(getProtocolLabel('Aave')).toBe('Aave')
    expect(getProtocolLabel('aave_v2')).toBe('Aave')
    expect(getProtocolLabel('MIDAS')).toBe('Midas')
  })

  it('falls back to the raw value for unknown strategies', () => {
    expect(getProtocolLabel('compound')).toBe('compound')
  })
})

describe('venueForStrategy', () => {
  it('maps aave-prefixed strategies to Aave', () => {
    expect(venueForStrategy('aave_v3')?.name).toBe('Aave')
    expect(venueForStrategy('AaveUsdc')?.name).toBe('Aave')
  })

  it('maps midas-prefixed strategies to Midas', () => {
    expect(venueForStrategy('midas-usdc')?.name).toBe('Midas')
    expect(venueForStrategy('MIDAS')?.name).toBe('Midas')
  })

  it('capitalizes unknown strategies', () => {
    expect(venueForStrategy('compound')?.name).toBe('Compound')
  })

  it('returns null for missing input', () => {
    expect(venueForStrategy(null)).toBeNull()
    expect(venueForStrategy(undefined)).toBeNull()
    expect(venueForStrategy('')).toBeNull()
  })
})
