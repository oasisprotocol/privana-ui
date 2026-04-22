import { formatUnits } from 'viem'
import type { QuoteResponse, TokenInfo } from '@/api/swap'

export type RateParts = {
  label: string
  fromSymbol: string
  toSymbol: string
}

export const computeRate = (
  quote: QuoteResponse,
  fromToken: TokenInfo | undefined,
  toToken: TokenInfo | undefined,
): RateParts | null => {
  if (fromToken?.token_decimals == null || toToken?.token_decimals == null) return null
  try {
    const fromAmountNum = Number(formatUnits(BigInt(quote.from_amount), fromToken.token_decimals))
    const toAmountNum = Number(formatUnits(BigInt(quote.to_amount_estimate), toToken.token_decimals))
    if (!fromAmountNum || !Number.isFinite(fromAmountNum) || !Number.isFinite(toAmountNum)) return null
    const rate = toAmountNum / fromAmountNum
    const fromSymbol = fromToken.token_symbol ?? fromToken.token_type_name
    const toSymbol = toToken.token_symbol ?? toToken.token_type_name
    return {
      label: `1 ${fromSymbol} = ${rate.toLocaleString('en-US', { maximumSignificantDigits: 6 })} ${toSymbol}`,
      fromSymbol,
      toSymbol,
    }
  } catch {
    return null
  }
}

export const computeFeeFiat = (
  quote: QuoteResponse,
  toToken: TokenInfo | undefined,
  prices: Record<string, number | undefined> | undefined,
): number | undefined => {
  if (toToken?.token_decimals == null) return undefined
  const price = prices?.[toToken.token_id]
  if (price == null) return undefined
  try {
    const feeTokens = Number(formatUnits(BigInt(quote.fee_amount), toToken.token_decimals))
    if (!Number.isFinite(feeTokens)) return undefined
    return feeTokens * price
  } catch {
    return undefined
  }
}
