import { describe, expect, it } from 'vitest'
import { parseSlippagePercent, slippageLabel, slippageNote } from './slippage'

describe('parseSlippagePercent', () => {
  it('reads a value in range', () => {
    expect(parseSlippagePercent('0.05')).toBe(0.05)
    expect(parseSlippagePercent('1.5')).toBe(1.5)
    expect(parseSlippagePercent('5')).toBe(5)
  })

  it('is null while empty, unfinished or out of range', () => {
    expect(parseSlippagePercent('')).toBeNull()
    expect(parseSlippagePercent('.')).toBeNull()
    expect(parseSlippagePercent('0')).toBeNull()
    expect(parseSlippagePercent('0.04')).toBeNull()
    expect(parseSlippagePercent('5.01')).toBeNull()
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

describe('slippageLabel', () => {
  it('shows the default for Auto and a custom value as is', () => {
    expect(slippageLabel(null)).toBe('Auto (0.5%)')
    expect(slippageLabel(1.5)).toBe('1.5%')
  })
})
