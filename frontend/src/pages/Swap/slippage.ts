// Services' default, applied when a quote request sends no slippage.
// Hardcoded until services return it with the quote: remove it then.
export const AUTO_SLIPPAGE_PERCENT = 0.5
export const MIN_SLIPPAGE_PERCENT = 0.05
export const MAX_SLIPPAGE_PERCENT = 5
const HIGH_SLIPPAGE_PERCENT = 1

export const parseSlippage = (input: string): number | null => {
  if (!input) return null
  const value = Number(input)
  return value >= MIN_SLIPPAGE_PERCENT && value <= MAX_SLIPPAGE_PERCENT ? value : null
}

export const slippageNote = (input: string): { kind: 'error' | 'warning'; text: string } | null => {
  if (!input) return null
  const value = parseSlippage(input)
  if (value == null) {
    return {
      kind: 'error',
      text: `Enter a value from ${MIN_SLIPPAGE_PERCENT}% to ${MAX_SLIPPAGE_PERCENT}%`,
    }
  }
  if (value > HIGH_SLIPPAGE_PERCENT) {
    return { kind: 'warning', text: `You may receive up to ${value}% less than the estimate` }
  }
  return null
}
