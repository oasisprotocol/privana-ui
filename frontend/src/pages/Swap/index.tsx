import { useAccount } from 'wagmi'
import { useHostedRedirectAuth } from '@oasisprotocol/privana-sdk'
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
