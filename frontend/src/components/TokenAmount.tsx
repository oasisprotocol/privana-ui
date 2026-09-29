import { formatTokenAmount, type AmountContext, type TokenMeta } from '@oasisprotocol/privana-sdk'

type TokenAmountProps = {
  amount: bigint | string
  token: TokenMeta
  context?: AmountContext
  withSymbol?: boolean
  className?: string
}

export const TokenAmount = ({ amount, token, context, withSymbol, className }: TokenAmountProps) => {
  const formatted = formatTokenAmount(amount, token, { context, withSymbol })
  return (
    <span className={className} title={formatted.exact} aria-label={formatted.aria}>
      {formatted.display}
    </span>
  )
}
