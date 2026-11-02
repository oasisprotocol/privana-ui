import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSystemAddresses } from './useSystemAddresses'

vi.mock('@oasisprotocol/privana-sdk', () => ({
  usePrivanaContext: () => ({
    networkConfig: { accountingContract: '0x1111111111111111111111111111111111111111' },
  }),
}))
vi.mock('@/api/earn', () => ({ useEarnPools: () => ({ data: { pools: [] }, isError: false }) }))
vi.mock('@/config/systemAddresses', () => ({
  RETIRED_ADDRESSES: ['0x2222222222222222222222222222222222222222'],
  RETIRED_SWAP_LP_ADDRESSES: [],
}))

describe('useSystemAddresses', () => {
  it('includes retired system addresses, so they stay out of Recents and blocked as recipients', () => {
    const { result } = renderHook(() => useSystemAddresses())

    expect(result.current.addresses).toContain('0x2222222222222222222222222222222222222222')
  })
})
