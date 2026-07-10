import { createContext } from 'react'
import type { SignInFormState } from './SignInForm'

export type ConnectWalletContextValue = {
  // Live sign-in form state + handlers (email hand-off + browser-wallet connect),
  // consumed by the login page ("/").
  signInForm: SignInFormState
}

export const ConnectWalletContext = createContext<ConnectWalletContextValue | null>(null)
