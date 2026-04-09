import { useAccount } from 'wagmi'
import { useHostedRedirectAuth } from '@oasisprotocol/flexvaults-sdk'
import { SwapLanding } from './SwapLanding'
import { SwapDashboard } from './SwapDashboard'

export const Swap = () => {
  const { isConnected } = useAccount()
  const { isAuthenticated } = useHostedRedirectAuth()

  if (isConnected && isAuthenticated) {
    return <SwapDashboard />
  }

  return <SwapLanding />
}
