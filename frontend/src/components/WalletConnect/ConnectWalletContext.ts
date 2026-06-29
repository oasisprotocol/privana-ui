import { createContext } from 'react'

export type ConnectWalletContextValue = {
  // Opens the Sign-in modal, which offers email/passkey (Turnkey's own modal)
  // and any detected browser wallets (connectWalletAccount, no login stamp).
  signIn: () => void
}

export const ConnectWalletContext = createContext<ConnectWalletContextValue | null>(null)
