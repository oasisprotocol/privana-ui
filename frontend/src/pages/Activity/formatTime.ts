const RELATIVE_TIME = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

// Timestamps arrive in seconds. Render the coarsest sensible unit ("Yesterday",
// "5 days ago") to match the PoC, capitalised to read as a header label.
export const formatActivityTime = (timestampSeconds: number): string => {
  const diffSeconds = timestampSeconds - Date.now() / 1000
  const absSeconds = Math.abs(diffSeconds)
  let label: string
  if (absSeconds < 60) label = 'Just now'
  else if (absSeconds < 3600) label = RELATIVE_TIME.format(Math.round(diffSeconds / 60), 'minute')
  else if (absSeconds < 86400) label = RELATIVE_TIME.format(Math.round(diffSeconds / 3600), 'hour')
  else label = RELATIVE_TIME.format(Math.round(diffSeconds / 86400), 'day')
  return label.charAt(0).toUpperCase() + label.slice(1)
}
