import { describe, expect, it } from 'vitest'
import { isAddress } from 'viem'
import { RETIRED_SYSTEM_ADDRESSES } from './systemAddresses'

describe('RETIRED_SYSTEM_ADDRESSES', () => {
  it('holds only valid addresses', () => {
    for (const { address } of Object.values(RETIRED_SYSTEM_ADDRESSES).flat()) {
      expect(isAddress(address), address).toBe(true)
    }
  })
})
