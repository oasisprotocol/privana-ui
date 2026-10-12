import { formatUnits } from 'viem'
import type { QuoteResponse, TokenInfo } from '@/api/swap'

type RateSide = { amount: string; decimals: number; symbol: string }

export const formatRate = (from: RateSide, to: RateSide): string | null => {
  try {
    const fromAmountNum = Number(formatUnits(BigInt(from.amount), from.decimals))
    const toAmountNum = Number(formatUnits(BigInt(to.amount), to.decimals))
    if (!fromAmountNum || !Number.isFinite(fromAmountNum) || !Number.isFinite(toAmountNum)) return null
    const rate = toAmountNum / fromAmountNum
    return `1 ${from.symbol} = ${rate.toLocaleString('en-US', { maximumSignificantDigits: 6 })} ${to.symbol}`
  } catch {
    return null
  }
}

export const computeRate = (
  quote: QuoteResponse,
  fromToken: TokenInfo | undefined,
  toToken: TokenInfo | undefined,
): string | null => {
  if (fromToken?.token_decimals == null || toToken?.token_decimals == null) return null
  return formatRate(
    {
      amount: quote.from_amount,
      decimals: fromToken.token_decimals,
      symbol: fromToken.token_symbol ?? fromToken.token_type_name,
    },
    {
      amount: quote.to_amount_estimate,
      decimals: toToken.token_decimals,
      symbol: toToken.token_symbol ?? toToken.token_type_name,
    },
  )
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

const tokenFiat = (
  amountWei: string,
  token: TokenInfo | undefined,
  prices: Record<string, number | undefined> | undefined,
): number | undefined => {
  if (token?.token_decimals == null) return undefined
  const price = prices?.[token.token_id]
  if (price == null) return undefined
  try {
    const asNum = Number(formatUnits(BigInt(amountWei), token.token_decimals))
    return Number.isFinite(asNum) ? asNum * price : undefined
  } catch {
    return undefined
  }
}

// Slippage + LP fee + chain-mapping spread baked into LiFi's route, expressed
// in fiat. = input − (net output + Privana fee).
export const computeRouteCostFiat = (
  quote: QuoteResponse,
  fromToken: TokenInfo | undefined,
  toToken: TokenInfo | undefined,
  prices: Record<string, number | undefined> | undefined,
): number | undefined => {
  const inputFiat = tokenFiat(quote.from_amount, fromToken, prices)
  const outputFiat = tokenFiat(quote.to_amount_estimate, toToken, prices)
  const feeFiat = computeFeeFiat(quote, toToken, prices)
  if (inputFiat == null || outputFiat == null || feeFiat == null) return undefined
  const cost = inputFiat - (outputFiat + feeFiat)
  return cost > 0 ? cost : undefined
}
