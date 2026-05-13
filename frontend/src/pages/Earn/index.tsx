import { useAccount } from 'wagmi'
import { useHostedRedirectAuth } from '@oasisprotocol/privana-sdk'
import { EarnDashboard } from './EarnDashboard'
import { EarnLanding } from './EarnLanding'

export const Earn = () => {
  const { isConnected } = useAccount()
  const { isAuthenticated } = useHostedRedirectAuth()

  if (isConnected && isAuthenticated) {
    return <EarnDashboard />
  }

  return <EarnLanding />
}
