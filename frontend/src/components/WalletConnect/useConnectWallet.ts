import { useContext } from 'react'
import { ConnectWalletContext } from './ConnectWalletContext'
import type { SignInFormState } from './SignInForm'

// Returns the action that opens the Sign-in modal (email/passkey + browser
// wallets). Used by the header button and page CTAs.
export const useConnectWallet = (): (() => void) => {
  const ctx = useContext(ConnectWalletContext)
  if (!ctx) throw new Error('useConnectWallet must be used within ConnectWalletProvider')
  return ctx.signIn
}

export const useSignInForm = (): SignInFormState => {
  const ctx = useContext(ConnectWalletContext)
  if (!ctx) throw new Error('useSignInForm must be used within ConnectWalletProvider')
  return ctx.signInForm
}
