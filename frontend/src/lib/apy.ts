// Basis points per whole unit: 10_000 bps = 100% = 1.0.
const BPS_PER_UNIT = 10_000

// Convert an APY in basis points to a fraction (500 bps → 0.05).
export const apyBpsToFraction = (bps: number): number => bps / BPS_PER_UNIT

// Format an APY given in basis points (500 = 5.00%).
export const formatApyBps = (bps: number, options: { signed?: boolean } = {}): string => {
  const pct = (bps / 100).toFixed(2)
  const sign = options.signed && bps > 0 ? '+' : ''
  return `${sign}${pct}%`
}
