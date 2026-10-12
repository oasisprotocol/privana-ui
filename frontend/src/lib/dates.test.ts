import { describe, expect, it } from 'vitest'
import { formatDateTime } from './dates'

describe('formatDateTime', () => {
  it('shows date and time of a unix timestamp', () => {
    const seconds = new Date(2026, 9, 12, 11, 17).getTime() / 1000
    expect(formatDateTime(seconds)).toMatch(/^Oct 12, 2026, 11:17\sAM$/)
  })
})
