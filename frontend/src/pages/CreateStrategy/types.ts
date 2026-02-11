export type StrategyData = {
  name: string
  amount: string
  token: string
  traders: { address: string; allocation: string }[]
}
