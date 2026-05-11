export const STRATEGY_LABELS: Record<string, string> = {
  'aave-v3': 'Max Yield Strategy',
}

export const PROTOCOL_LABELS: Record<string, string> = {
  'aave-v3': 'AAVE',
}

export const formatApyBps = (bps: number, options: { signed?: boolean } = {}): string => {
  const pct = (bps / 100).toFixed(2)
  const sign = options.signed && bps > 0 ? '+' : ''
  return `${sign}${pct}%`
}
