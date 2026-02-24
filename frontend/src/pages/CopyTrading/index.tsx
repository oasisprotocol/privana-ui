import { useAccount } from 'wagmi'
import { CopyTradingLanding } from './CopyTradingLanding'
import { CopyTradingDashboard } from './CopyTradingDashboard'

export const CopyTrading = () => {
  const { isConnected } = useAccount()

  if (isConnected) {
    return <CopyTradingDashboard />
  }

  return <CopyTradingLanding />
}
