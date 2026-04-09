import { formatUnits } from 'viem'

const fiatFormatter = new Intl.NumberFormat('en-US', {
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
