import { describe, expect, it } from 'vitest'
import { ALLOWED_TOKEN_IDS, getGeckoId, SWAPPABLE_TOKEN_IDS } from '@/config/tokens'

describe('token id lists', () => {
  it('derives swappable ids as a subset of the allowed ids', () => {
    const allowed = new Set<string>(ALLOWED_TOKEN_IDS)
    expect(ALLOWED_TOKEN_IDS.length).toBeGreaterThan(0)
    expect(SWAPPABLE_TOKEN_IDS.length).toBeGreaterThan(0)
    for (const id of SWAPPABLE_TOKEN_IDS) expect(allowed.has(id)).toBe(true)
  })
})

describe('getGeckoId', () => {
  it('returns a CoinGecko id for every allowed token', () => {
    for (const id of ALLOWED_TOKEN_IDS) expect(getGeckoId(id)).toBeTruthy()
  })

  it('returns undefined for an unknown token id', () => {
    expect(getGeckoId('0xdead')).toBeUndefined()
  })
})
