import { createContext } from 'react'

export type ActivityStatus = 'in-progress' | 'completed' | 'failed'

export type ActivityTokenInfo = { id: string; symbol: string; decimals: number }

export type SwapActivity = {
  id: string
  type: 'swap'
  status: ActivityStatus
  createdAt: number
  fromToken: ActivityTokenInfo
  toToken: ActivityTokenInfo
  fromAmount: string
  toAmount: string
  rateLabel: string
  feeFiat?: number
  swapId?: string
  txHash?: string
  error?: string
}

export type EarnActivity = {
  id: string
  type: 'earn'
  status: ActivityStatus
  createdAt: number
  token: ActivityTokenInfo
  amount: string
  poolId: string
  protocol: string
  apyLabel?: string
  depositId?: string
  txHash?: string
  error?: string
}

export type Activity = SwapActivity | EarnActivity

export type ActivityContextValue = {
  activities: Activity[]
  pendingCount: number
  addActivity: (activity: Activity) => void
  updateActivity: (id: string, patch: Partial<Activity>) => void
}

export const ActivityContext = createContext<ActivityContextValue | null>(null)
