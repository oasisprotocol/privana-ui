export type StrategyData = {
  name: string
  amount: string
  traders: { address: string; allocation: number }[]
}

export type TraderDisplayData = {
  id: string
  address: string
  lastTrade: string
  size: string
  monthlyPnl: string
}

export type TradersFormValues = {
  traders: { address: string; allocation: number }[]
}
