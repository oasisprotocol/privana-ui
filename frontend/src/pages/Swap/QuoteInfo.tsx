import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import type { QuoteResponse, TokenInfo } from '@/api/swap'
import { formatFiat } from '@/lib/tokens'
import { computeFeeFiat, computeRate, computeRouteCostFiat } from './quoteHelpers'

type QuoteInfoProps = {
  quote: QuoteResponse
  fromToken: TokenInfo | undefined
  toToken: TokenInfo | undefined
  prices: Record<string, number | undefined> | undefined
}

export const QuoteInfo = ({ quote, fromToken, toToken, prices }: QuoteInfoProps) => {
  const rateLabel = useMemo(() => {
    const rate = computeRate(quote, fromToken, toToken)
    if (!rate || !fromToken) return null
    const fromPrice = prices?.[fromToken.token_id]
    const suffix = fromPrice != null ? ` (≈${formatFiat(fromPrice)})` : ''
    return `${rate}${suffix}`
  }, [quote, fromToken, toToken, prices])

  const feeFiat = useMemo(() => computeFeeFiat(quote, toToken, prices), [quote, toToken, prices])
  const routeCostFiat = useMemo(
    () => computeRouteCostFiat(quote, fromToken, toToken, prices),
    [quote, fromToken, toToken, prices],
  )

  return (
    <div className="flex flex-col gap-2.5 py-1 text-xs font-medium">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-muted-foreground">{rateLabel ?? ''}</p>
        <Badge variant="secondary">⚡ Best route</Badge>
      </div>
      <div className="flex items-center justify-between px-0.5">
        <p className="text-muted-foreground">Network &amp; route fee</p>
        <p className="text-foreground">{routeCostFiat != null ? `~${formatFiat(routeCostFiat)}` : '—'}</p>
      </div>
      <div className="flex items-center justify-between px-0.5">
        <p className="text-muted-foreground">Service fee</p>
        <p className="text-foreground">{feeFiat != null ? `~${formatFiat(feeFiat)}` : '—'}</p>
      </div>
    </div>
  )
}
