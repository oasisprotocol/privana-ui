import { describe, expect, it } from 'vitest'
import type { MergedRow } from '@/hooks/use-merged-activity'
import { dayLabel, groupRowsByDay } from './groupByDay'

const NOW = new Date(2026, 9, 2, 12, 0).getTime()
const at = (month: number, day: number, hour = 10, year = 2026) =>
  Math.floor(new Date(year, month, day, hour).getTime() / 1000)

const row = (timestamp: number): MergedRow => ({ source: 'chain', timestamp }) as unknown as MergedRow

describe('dayLabel', () => {
  it('names today and yesterday', () => {
    expect(dayLabel(at(9, 2, 1), NOW)).toBe('Today')
    expect(dayLabel(at(9, 1, 23), NOW)).toBe('Yesterday')
  })

  it('uses the weekday within the last week', () => {
    expect(dayLabel(at(8, 28), NOW)).toBe('Monday')
    expect(dayLabel(at(8, 26), NOW)).toBe('Saturday')
  })

  it('falls back to the date, with the year only when it differs', () => {
    expect(dayLabel(at(8, 25), NOW)).toBe('Sep 25')
    expect(dayLabel(at(11, 31, 10, 2025), NOW)).toBe('Dec 31, 2025')
  })

  it('treats a timestamp slightly ahead of this clock as today', () => {
    expect(dayLabel(at(9, 3, 0), NOW)).toBe('Today')
  })
})

describe('groupRowsByDay', () => {
  it('groups consecutive rows by local day, keeping their order', () => {
    const rows = [row(at(9, 2, 11)), row(at(9, 2, 9)), row(at(9, 1, 20)), row(at(8, 20))]
    const groups = groupRowsByDay(rows, NOW)
    expect(groups.map(g => [g.label, g.rows.length])).toEqual([
      ['Today', 2],
      ['Yesterday', 1],
      ['Sep 20', 1],
    ])
    expect(groups[0].rows).toEqual(rows.slice(0, 2))
  })

  it('returns no groups for no rows', () => {
    expect(groupRowsByDay([], NOW)).toEqual([])
  })
})
