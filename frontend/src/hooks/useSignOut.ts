import { useDisconnect } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { clearTurnkeyWallet } from '@/wallet/turnkeyBridge'
import { forgetBootSession } from '@/pages/Dashboard/DashboardHome/useBootPhase'

export const useSignOut = (): (() => void) => {
  const { mutate: disconnect } = useDisconnect()
  const { logout } = useSiweAuth()

  return () => {
    clearTurnkeyWallet()
    forgetBootSession()
    disconnect()
    void logout()
  }
}
