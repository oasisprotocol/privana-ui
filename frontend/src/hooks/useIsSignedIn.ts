import { useAccount } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'

// Fully signed in = a connected wallet *and* a live SIWE session. The two settle
// independently (wagmi reconnects a stored wallet before SIWE re-authenticates),
// so every gate in the app has to require both. Single definition, since a route
// guard that disagrees with the nav is how you get a redirect loop.
export const useIsSignedIn = (): boolean => {
  const { address, isConnected } = useAccount()
  const { isAuthenticated } = useSiweAuth()
  return isConnected && !!address && isAuthenticated
}
