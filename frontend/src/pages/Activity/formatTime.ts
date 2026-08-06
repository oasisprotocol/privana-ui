const TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export const formatActivityTime = (timestampSeconds: number): string => {
  const date = new Date(timestampSeconds * 1000)
  const startOfToday = new Date().setHours(0, 0, 0, 0)
  const startOfDate = new Date(timestampSeconds * 1000).setHours(0, 0, 0, 0)
  if (startOfDate >= startOfToday) return `Today, ${TIME_FORMAT.format(date)}`
  return DATE_FORMAT.format(date)
}
