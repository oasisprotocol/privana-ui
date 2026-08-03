import { useAccount } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { useTurnkeyWalletIntent } from '@/wallet/turnkeyIntent'

export const useAuthBootstrapping = (): boolean => {
  const { status } = useAccount()
  const { isLoading: isAuthLoading, error: siweError } = useSiweAuth()
  const intent = useTurnkeyWalletIntent()

  if (status === 'reconnecting' || status === 'connecting' || isAuthLoading) return true
  if (intent === 'embedded' && !siweError) return true
  return false
}
