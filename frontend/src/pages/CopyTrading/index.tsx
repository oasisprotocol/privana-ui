import { useAccount } from 'wagmi'
import { useHostedRedirectAuth } from '@oasisprotocol/flexvaults-sdk'
import { CopyTradingLanding } from './CopyTradingLanding'
import { CopyTradingDashboard } from './CopyTradingDashboard'

export const CopyTrading = () => {
  const { isConnected } = useAccount()
  const { isAuthenticated } = useHostedRedirectAuth()

  if (isConnected && isAuthenticated) {
    return <CopyTradingDashboard />
  }

  return <CopyTradingLanding />
}
