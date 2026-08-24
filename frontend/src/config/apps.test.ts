import { describe, expect, it } from 'vitest'
import { appForAddress, appNameForAddress, venueForStrategy } from '@/config/apps'

// Deliberately a literal, not KNOWN_APPS[0]: asserting against the same source
// the code reads from would make the test vacuous. Update on address rotation.
const HONOROLL_ADDRESS = '0xDCFF0891F0Aea40b0ae4A7Ca3e00AD1012Fc2d16'

describe('appForAddress', () => {
  it('matches a known service address regardless of casing', () => {
    expect(appForAddress(HONOROLL_ADDRESS)?.name).toBe('Honoroll')
    expect(appForAddress(HONOROLL_ADDRESS.toLowerCase())?.name).toBe('Honoroll')
    expect(appForAddress(HONOROLL_ADDRESS.toUpperCase().replace('0X', '0x'))?.name).toBe('Honoroll')
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
    expect(appNameForAddress(HONOROLL_ADDRESS.toLowerCase())).toBe('Honoroll')
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
