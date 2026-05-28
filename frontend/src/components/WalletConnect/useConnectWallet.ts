import { useContext } from 'react'
import { ConnectWalletContext } from './ConnectWalletContext'

// Opens the Turnkey auth modal. Used by the header button and the page CTAs.
export const useConnectWallet = (): (() => void) => {
  const ctx = useContext(ConnectWalletContext)
  if (!ctx) throw new Error('useConnectWallet must be used within ConnectWalletProvider')
  return ctx.connectWallet
}
