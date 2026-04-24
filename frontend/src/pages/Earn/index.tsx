import { useAccount } from 'wagmi'
import { useHostedRedirectAuth } from '@oasisprotocol/flexvaults-sdk'
import { EarnDashboard } from './EarnDashboard'

export const Earn = () => {
  const { isConnected } = useAccount()
  const { isAuthenticated } = useHostedRedirectAuth()

  if (isConnected && isAuthenticated) {
    return <EarnDashboard />
  }

  return <h1 className="text-3xl font-medium text-foreground">Earn</h1>
}
