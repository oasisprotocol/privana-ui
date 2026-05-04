import { useMemo } from 'react'
import type { QuoteResponse, TokenInfo } from '@/api/swap'
import { formatFiat } from '@/lib/tokens'
import { computeFeeFiat, computeRate, computeRouteCostFiat } from './quoteHelpers'

export type QuoteSummary = {
  rateLabel: string
  rateLabelDetailed: string
  feeFiat: number | undefined
  feeFiatLabel: string
  routeCostFiatLabel: string
}

const formatRow = (n: number | undefined): string => (n != null ? `~${formatFiat(n)}` : '-')

const EMPTY: QuoteSummary = {
  rateLabel: '',
  rateLabelDetailed: '',
  feeFiat: undefined,
  feeFiatLabel: '-',
  routeCostFiatLabel: '-',
}

export const useQuoteSummary = (
  quote: QuoteResponse | null | undefined,
  fromToken: TokenInfo | undefined,
  toToken: TokenInfo | undefined,
  prices: Record<string, number | undefined> | undefined,
): QuoteSummary => {
  return useMemo(() => {
    if (!quote) return EMPTY
    const rate = computeRate(quote, fromToken, toToken)
    const feeFiat = computeFeeFiat(quote, toToken, prices)
    const routeCostFiat = computeRouteCostFiat(quote, fromToken, toToken, prices)
    const fromPrice = fromToken ? prices?.[fromToken.token_id] : undefined
    const suffix = rate && fromPrice != null ? ` (≈${formatFiat(fromPrice)})` : ''
    return {
      rateLabel: rate ?? '',
      rateLabelDetailed: rate ? `${rate}${suffix}` : '',
      feeFiat,
      feeFiatLabel: formatRow(feeFiat),
      routeCostFiatLabel: formatRow(routeCostFiat),
    }
  }, [quote, fromToken, toToken, prices])
}
