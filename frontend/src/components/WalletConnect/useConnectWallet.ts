import { useContext } from 'react'
import { ConnectWalletContext } from './ConnectWalletContext'
import type { SignInFormState } from './SignInForm'

// Live sign-in form state, so the login page can render the wallet/email form.
export const useSignInForm = (): SignInFormState => {
  const ctx = useContext(ConnectWalletContext)
  if (!ctx) throw new Error('useSignInForm must be used within ConnectWalletProvider')
  return ctx.signInForm
}
