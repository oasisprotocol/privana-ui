import { formatUnits } from 'viem'
import { parseAmountInput } from '@oasisprotocol/privana-sdk'

// Typed amounts are parsed by the SDK, like its own modals: no float, no rounding.
const parse = (amount: string, decimals: number) => parseAmountInput(amount, { symbol: '', decimals })

/** Base units of a typed amount, or null while it is empty, not a number, or too precise. */
export const parseAmount = (amount: string, decimals: number | null | undefined): bigint | null => {
  if (decimals == null) return null
  const parsed = parse(amount, decimals)
  return parsed.ok ? parsed.raw : null
}

export const isPositiveAmount = (amount: string, decimals: number | null | undefined): boolean =>
  (parseAmount(amount, decimals) ?? 0n) > 0n

// Whether a human-entered amount exceeds a base-units cap (wallet balance / position).
export const exceedsAmount = (
  amount: string,
  decimals: number | null | undefined,
  maxWei: bigint,
): boolean => {
  const raw = parseAmount(amount, decimals)
  return raw != null && raw > maxWei
}

export const amountFiat = (
  amount: string,
  decimals: number | null | undefined,
  price: number | undefined,
): number | undefined => {
  const units = parseAmount(amount, decimals)
  if (units == null || decimals == null || price == null) return undefined
  const value = Number(formatUnits(units, decimals))
  return Number.isFinite(value) ? value * price : undefined
}

/** What is wrong with a typed amount the token can't hold, worded like the SDK's modals. */
export const amountInputError = (amount: string, decimals: number | null | undefined): string | null => {
  if (decimals == null) return null
  const parsed = parse(amount, decimals)
  return !parsed.ok && parsed.reason === 'too-precise' ? `Too many decimal places (max: ${decimals})` : null
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
