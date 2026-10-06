import { describe, expect, it } from 'vitest'
import { isValidElement, type ReactElement } from 'react'
import {
  depositNoticeFor,
  getProtocolIcon,
  getProtocolLabel,
  venueForStrategy,
  withdrawNoticeFor,
} from '@/config/protocols'

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

describe('getProtocolIcon', () => {
  const icon = (strategy: string, size?: number) =>
    getProtocolIcon(strategy, size) as ReactElement<{ height?: number }>

  it('matches like the label, so a strategy variant keeps its logo', () => {
    expect(icon('aave-v3').type).toBe('img')
    expect(icon('aave_v2').type).toBe('img')
    expect(icon('midas-mtbill').type).toBe('svg')
  })

  it('draws the logo at the requested size', () => {
    expect(isValidElement(icon('midas-mtbill', 14))).toBe(true)
    expect(icon('midas-mtbill', 14).props.height).toBe(14)
  })

  it('has no icon for an unknown strategy', () => {
    expect(getProtocolIcon('compound')).toBeNull()
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

describe('depositNoticeFor', () => {
  it('asks Midas depositors to accept its withdrawal delay', () => {
    expect(depositNoticeFor('midas-mtbill')).toMatch(/up to 12 hours/)
  })

  it('has nothing for protocols with instant liquidity', () => {
    expect(depositNoticeFor('aave-v3')).toBeUndefined()
    expect(depositNoticeFor('compound')).toBeUndefined()
  })
})

describe('withdrawNoticeFor', () => {
  it('warns that Midas withdrawals can take up to 12 hours', () => {
    expect(withdrawNoticeFor('midas-mtbill')).toMatch(/up to 12 hours/)
  })

  it('has nothing for protocols with instant liquidity', () => {
    expect(withdrawNoticeFor('aave-v3')).toBeUndefined()
  })
})
