import { describe, expect, it } from 'vitest'
import { parseSlippage, slippageNote } from './slippage'

describe('parseSlippage', () => {
  it('reads a value in range', () => {
    expect(parseSlippage('0.05')).toBe(0.05)
    expect(parseSlippage('1.5')).toBe(1.5)
    expect(parseSlippage('5')).toBe(5)
  })

  it('is null while empty, unfinished or out of range', () => {
    expect(parseSlippage('')).toBeNull()
    expect(parseSlippage('.')).toBeNull()
    expect(parseSlippage('0')).toBeNull()
    expect(parseSlippage('0.04')).toBeNull()
    expect(parseSlippage('5.01')).toBeNull()
  })
})

describe('slippageNote', () => {
  it('says nothing for Auto or an ordinary value', () => {
    expect(slippageNote('')).toBeNull()
    expect(slippageNote('0.5')).toBeNull()
    expect(slippageNote('1')).toBeNull()
  })

  it('warns about a high value', () => {
    expect(slippageNote('2')).toEqual({
      kind: 'warning',
      text: 'You may receive up to 2% less than the estimate',
    })
  })

  it('rejects a value out of range', () => {
    expect(slippageNote('10')?.kind).toBe('error')
  })
})
