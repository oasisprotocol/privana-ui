// Format an APY given in basis points (500 = 5.00%).
export const formatApyBps = (bps: number, options: { signed?: boolean } = {}): string => {
  const pct = (bps / 100).toFixed(2)
  const sign = options.signed && bps > 0 ? '+' : ''
  return `${sign}${pct}%`
}
