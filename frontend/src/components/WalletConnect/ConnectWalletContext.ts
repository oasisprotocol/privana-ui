import { createContext } from 'react'
import type { SignInFormState } from './SignInForm'

export type ConnectWalletContextValue = {
  // Opens the Sign-in modal, which offers email/passkey (Turnkey's own modal)
  // and any detected browser wallets (connectWalletAccount, no login stamp).
  signIn: () => void
  // Live sign-in form state + handlers, so the standalone login page can render
  // the same form the modal uses, driven by the same connect logic.
  signInForm: SignInFormState
}

export const ConnectWalletContext = createContext<ConnectWalletContextValue | null>(null)
