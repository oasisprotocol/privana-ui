import { useDisconnect } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { clearTurnkeyWallet } from '@/wallet/turnkeyBridge'

export const useSignOut = (): (() => void) => {
  const { disconnect } = useDisconnect()
  const { logout } = useSiweAuth()

  return () => {
    clearTurnkeyWallet()
    disconnect()
    void logout()
  }
}
