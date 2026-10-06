import type { MergedRow } from '@/hooks/use-merged-activity'

const DAY_MS = 86_400_000

const startOfDay = (ms: number) => new Date(ms).setHours(0, 0, 0, 0)

export function dayLabel(timestampSeconds: number, now = Date.now()): string {
  const date = new Date(timestampSeconds * 1000)
  const days = Math.round((startOfDay(now) - startOfDay(date.getTime())) / DAY_MS)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric',
  })
}

export type DayGroup = { key: string; label: string; rows: MergedRow[] }

export function groupRowsByDay(rows: MergedRow[], now = Date.now()): DayGroup[] {
  const groups: DayGroup[] = []
  for (const row of rows) {
    const key = new Date(row.timestamp * 1000).toDateString()
    const last = groups[groups.length - 1]
    if (last?.key === key) last.rows.push(row)
    else groups.push({ key, label: dayLabel(row.timestamp, now), rows: [row] })
  }
  return groups
}
