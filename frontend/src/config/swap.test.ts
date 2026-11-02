import { describe, expect, it, vi } from 'vitest'
import { isSwapLpAddress } from './swap'

vi.hoisted(() => vi.stubEnv('VITE_SWAP_LP_ADDRESS', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'))
vi.mock('./systemAddresses', () => ({
  RETIRED_SWAP_LP_ADDRESSES: ['0x2222222222222222222222222222222222222222'],
}))

describe('isSwapLpAddress', () => {
  it('matches the current LP in any case', () => {
    expect(isSwapLpAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(true)
    expect(isSwapLpAddress('0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')).toBe(true)
  })

  it('matches a retired LP, so its old swap legs still read as swaps', () => {
    expect(isSwapLpAddress('0x2222222222222222222222222222222222222222')).toBe(true)
  })

  it('rejects other addresses and empty values', () => {
    expect(isSwapLpAddress('0x3333333333333333333333333333333333333333')).toBe(false)
    expect(isSwapLpAddress(null)).toBe(false)
    expect(isSwapLpAddress('')).toBe(false)
  })
})
