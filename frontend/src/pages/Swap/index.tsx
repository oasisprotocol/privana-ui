import { useAccount } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { SwapLanding } from './SwapLanding'
import { SwapDashboard } from './SwapDashboard'

export const Swap = () => {
  const { isConnected } = useAccount()
  const { isAuthenticated } = useSiweAuth()

  if (isConnected && isAuthenticated) {
    return <SwapDashboard />
  }

  return <SwapLanding />
}
