import { useContext } from 'react'
import { WalletModalContext } from './WalletModalContext'

// Imperatively open the shared wallet picker. Used by the header button and the
// page CTAs alike.
export const useOpenWalletModal = (): (() => void) => {
  const ctx = useContext(WalletModalContext)
  if (!ctx) throw new Error('useOpenWalletModal must be used within WalletModalProvider')
  return ctx.openWalletModal
}
