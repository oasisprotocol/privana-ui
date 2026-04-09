import { formatUnits } from 'viem'

const fiatFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatFiat = (value: number) => fiatFormatter.format(value)

export const formatAmount = (amount: bigint, decimals: number) => {
  return Number(formatUnits(amount, decimals)).toFixed(decimals <= 6 ? 2 : 6)
}
