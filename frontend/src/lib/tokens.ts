import { formatUnits, parseUnits } from 'viem'

export const isPositiveAmount = (amount: string, decimals: number | null | undefined): boolean => {
  if (!amount || decimals == null) return false
  try {
    return parseUnits(amount, decimals) > 0n
  } catch {
    return false
  }
}

// Whether a human-entered amount exceeds a base-units cap (wallet balance / position).
export const exceedsAmount = (
  amount: string,
  decimals: number | null | undefined,
  maxWei: bigint,
): boolean => {
  if (!amount || decimals == null) return false
  try {
    return parseUnits(amount, decimals) > maxWei
  } catch {
    return false
  }
}

export const fiatFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatFiat = (value: number) => fiatFormatter.format(value)

export const formatAmount = (
  amount: bigint,
  tokenDecimals: number,
  displayDecimals: number = tokenDecimals <= 6 ? 2 : 6,
) => {
  const value = formatUnits(amount, tokenDecimals)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: displayDecimals,
    maximumFractionDigits: displayDecimals,
  }).format(value as unknown as number)
}

// Truncate at maxDecimals (no rounding — never shows more than the user gets)
// and drop trailing zeros. Examples: "0.002063317108728893" → "0.002063",
// "1.000000" → "1", "0" → "0", for small amounts "<0.000001".
export const formatAmountTrimmed = (
  amount: bigint,
  tokenDecimals: number,
  maxDecimals: number = 6,
): string => {
  if (amount === 0n) return '0'
  const [intPart, decPart = ''] = formatUnits(amount, tokenDecimals).split('.')
  const truncated = decPart.slice(0, maxDecimals).replace(/0+$/, '')
  if (truncated) return `${intPart}.${truncated}`
  return intPart === '0' ? `<0.${'0'.repeat(maxDecimals - 1)}1` : intPart
}
