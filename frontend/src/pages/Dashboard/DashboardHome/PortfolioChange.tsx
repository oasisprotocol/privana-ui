import { FC } from 'react'

type PortfolioCardProps = {
  amount: string
  changePercentage: string
}
export const PortfolioChange: FC<PortfolioCardProps> = ({ amount, changePercentage }) => {
  return (
    <>
      <p className="text-[30px] leading-9 font-medium text-card-foreground">{amount}</p>
      <p className="text-[30px] leading-9 font-medium text-chart-positive">{changePercentage}</p>
      <p className="text-sm font-semibold text-card-foreground">24h change</p>
    </>
  )
}
