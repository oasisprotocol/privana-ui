import { useMemo } from 'react'
import { formatUnits } from 'viem'
import { Badge } from '@/components/ui/badge'
import type { QuoteResponse, TokenInfo } from '@/api/swap'
import { formatFiat } from '@/lib/tokens'

type QuoteInfoProps = {
  quote: QuoteResponse
  fromToken: TokenInfo | undefined
  toToken: TokenInfo | undefined
  prices: Record<string, number | undefined> | undefined
}

export const QuoteInfo = ({ quote, fromToken, toToken, prices }: QuoteInfoProps) => {
  const rateLabel = useMemo(() => {
    if (fromToken?.token_decimals == null || toToken?.token_decimals == null) return null
    try {
      const fromAmountNum = Number(formatUnits(BigInt(quote.from_amount), fromToken.token_decimals))
      const toAmountNum = Number(formatUnits(BigInt(quote.to_amount_estimate), toToken.token_decimals))
      if (!fromAmountNum || !Number.isFinite(fromAmountNum) || !Number.isFinite(toAmountNum)) return null
      const rate = toAmountNum / fromAmountNum
      const fromSymbol = fromToken.token_symbol ?? fromToken.token_type_name
      const toSymbol = toToken.token_symbol ?? toToken.token_type_name
      const fromPrice = prices?.[fromToken.token_id]
      const suffix = fromPrice != null ? ` (≈${formatFiat(fromPrice)})` : ''
      return `1 ${fromSymbol} = ${rate.toLocaleString('en-US', { maximumSignificantDigits: 6 })} ${toSymbol}${suffix}`
    } catch {
      return null
    }
  }, [quote, fromToken, toToken, prices])

  const feeFiat = useMemo(() => {
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
  }, [quote, toToken, prices])

  return (
    <div className="flex flex-col gap-2.5 py-1 text-xs font-medium">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-muted-foreground">{rateLabel ?? ''}</p>
        <Badge variant="secondary">⚡ Best route</Badge>
      </div>
      <div className="flex items-center justify-between px-0.5">
        <p className="text-muted-foreground">Estimated fee</p>
        <p className="text-foreground">{feeFiat != null ? `~${formatFiat(feeFiat)}` : '—'}</p>
      </div>
    </div>
  )
}
