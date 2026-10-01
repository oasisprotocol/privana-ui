import { describe, expect, it } from 'vitest'
import { ALLOWED_TOKEN_IDS, SWAPPABLE_TOKEN_IDS } from '@/config/tokens'

describe('token id lists', () => {
  it('derives swappable ids as a subset of the allowed ids', () => {
    const allowed = new Set<string>(ALLOWED_TOKEN_IDS)
    expect(ALLOWED_TOKEN_IDS.length).toBeGreaterThan(0)
    expect(SWAPPABLE_TOKEN_IDS.length).toBeGreaterThan(0)
    for (const id of SWAPPABLE_TOKEN_IDS) expect(allowed.has(id)).toBe(true)
  })
})
