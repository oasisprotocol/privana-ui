import { createContext } from 'react'

export type WalletModalContextValue = {
  openWalletModal: () => void
}

export const WalletModalContext = createContext<WalletModalContextValue | null>(null)
