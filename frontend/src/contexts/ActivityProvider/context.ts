import { createContext } from 'react'

export type SwapActivityStatus = 'in-progress' | 'completed' | 'failed'

export type SwapActivity = {
  id: string
  type: 'swap'
  status: SwapActivityStatus
  createdAt: number
  fromToken: { id: string; symbol: string; decimals: number }
  toToken: { id: string; symbol: string; decimals: number }
  fromAmount: string
  toAmount: string
  rateLabel: string
  feeFiat?: number
  swapId?: string
  txHash?: string
  error?: string
}

export type Activity = SwapActivity

export type ActivityContextValue = {
  activities: Activity[]
  pendingCount: number
  addActivity: (activity: Activity) => void
  updateActivity: (id: string, patch: Partial<Activity>) => void
}

export const ActivityContext = createContext<ActivityContextValue | null>(null)
