import { useAccount } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { EarnDashboard } from './EarnDashboard'
import { EarnLanding } from './EarnLanding'

export const Earn = () => {
  const { isConnected } = useAccount()
  const { isAuthenticated } = useSiweAuth()

  if (isConnected && isAuthenticated) {
    return <EarnDashboard />
  }

  return <EarnLanding />
}
