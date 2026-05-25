import { useAccount } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { CopyTradingLanding } from './CopyTradingLanding'
import { CopyTradingDashboard } from './CopyTradingDashboard'

export const CopyTrading = () => {
  const { isConnected } = useAccount()
  const { isAuthenticated } = useSiweAuth()

  if (isConnected && isAuthenticated) {
    return <CopyTradingDashboard />
  }

  return <CopyTradingLanding />
}
