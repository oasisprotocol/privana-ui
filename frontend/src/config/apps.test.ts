import { describe, expect, it } from 'vitest'
import { appForAddress, appNameForAddress, KNOWN_APPS, venueForStrategy } from '@/config/apps'

const honoroll = KNOWN_APPS[0]

describe('appForAddress', () => {
  it('matches a known service address regardless of casing', () => {
    expect(appForAddress(honoroll.serviceAddress)).toBe(honoroll)
    expect(appForAddress(honoroll.serviceAddress.toLowerCase())).toBe(honoroll)
    expect(appForAddress(honoroll.serviceAddress.toUpperCase().replace('0X', '0x'))).toBe(honoroll)
  })

  it('returns null for unknown or missing addresses', () => {
    expect(appForAddress('0x0000000000000000000000000000000000000000')).toBeNull()
    expect(appForAddress(null)).toBeNull()
    expect(appForAddress(undefined)).toBeNull()
    expect(appForAddress('')).toBeNull()
  })
})

describe('appNameForAddress', () => {
  it('returns the app name for a known address', () => {
    expect(appNameForAddress(honoroll.serviceAddress.toLowerCase())).toBe(honoroll.name)
  })

  it('returns null for unknown or missing addresses', () => {
    expect(appNameForAddress('0x0000000000000000000000000000000000000000')).toBeNull()
    expect(appNameForAddress(null)).toBeNull()
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
