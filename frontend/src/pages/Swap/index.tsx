import { useAccount } from 'wagmi'
import { SwapLanding } from './SwapLanding'
import { SwapDashboard } from './SwapDashboard'

export const Swap = () => {
  const { isConnected } = useAccount()

  if (isConnected) {
    return <SwapDashboard />
  }

  return <SwapLanding />
}
