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

export interface MergedTokenAmount {
  symbol: string
  name: string
  amount: bigint
  decimals: number
  /** Sum of the constituent ids' values; undefined when any of them lacks a price. */
  fiat: number | undefined
}

// Merges per-token-id amounts by ticker so ids sharing a symbol (e.g. several
// USDC ids) collapse into one entry. Raw base-unit amounts with mismatched
// decimals aren't directly addable, so both are aligned to the larger
// precision first. Fiat is accumulated per id (prices are keyed by token id)
// and turns undefined if any constituent is unpriced, so a partially priced
// merge never shows a too-low value.
export function mergeTokensBySymbol(
  items: { tokenId: string; amount: string; symbol?: string }[],
  getTokenById: (id: string) => { symbol: string; name: string; decimals: number } | undefined,
  prices?: Record<string, number | undefined>,
): MergedTokenAmount[] {
  const bySymbol = new Map<string, MergedTokenAmount>()
  for (const it of items) {
    const amount = BigInt(it.amount || '0')
    if (amount <= 0n) continue
    const token = getTokenById(it.tokenId)
    const symbol = it.symbol ?? token?.symbol
    const decimals = token?.decimals
    if (!symbol || decimals == null) continue
    const price = prices?.[it.tokenId]
    const fiat = price != null ? Number(formatUnits(amount, decimals)) * price : undefined
    const existing = bySymbol.get(symbol)
    if (!existing) {
      bySymbol.set(symbol, { symbol, name: token?.name ?? symbol, amount, decimals, fiat })
    } else {
      if (existing.decimals === decimals) {
        existing.amount += amount
      } else {
        const maxDecimals = Math.max(existing.decimals, decimals)
        existing.amount =
          existing.amount * 10n ** BigInt(maxDecimals - existing.decimals) +
          amount * 10n ** BigInt(maxDecimals - decimals)
        existing.decimals = maxDecimals
      }
      existing.fiat = existing.fiat != null && fiat != null ? existing.fiat + fiat : undefined
    }
  }
  return [...bySymbol.values()]
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
