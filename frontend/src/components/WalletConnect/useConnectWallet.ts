import { useContext } from 'react'
import { ConnectWalletContext } from './ConnectWalletContext'

// Returns the action that opens the Sign-in modal (email/passkey + browser
// wallets). Used by the header button and page CTAs.
export const useConnectWallet = (): (() => void) => {
  const ctx = useContext(ConnectWalletContext)
  if (!ctx) throw new Error('useConnectWallet must be used within ConnectWalletProvider')
  return ctx.signIn
}
