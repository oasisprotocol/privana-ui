import { createContext } from 'react'

export type ConnectWalletContextValue = {
  // Opens Turnkey's auth modal (passkey / email / OAuth / external wallet).
  connectWallet: () => void
}

export const ConnectWalletContext = createContext<ConnectWalletContextValue | null>(null)
