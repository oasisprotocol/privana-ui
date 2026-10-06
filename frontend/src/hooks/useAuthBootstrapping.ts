import { useConnection } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { useTurnkeyWalletIntent } from '@/wallet/turnkeyIntent'
import { useConnectedWalletRecord } from '@/wallet/turnkeyConnectedWallet'

export const useAuthBootstrapping = (): boolean => {
  const { status } = useConnection()
  const { isLoading: isAuthLoading, error: siweError, sessionExpired } = useSiweAuth()
  const intent = useTurnkeyWalletIntent()
  const connectedWallet = useConnectedWalletRecord()

  if (status === 'reconnecting' || status === 'connecting' || isAuthLoading) return true
  // An ended session is settled: Home asks the user to sign again.
  if (!siweError && !sessionExpired && (intent === 'embedded' || connectedWallet)) return true
  return false
}
