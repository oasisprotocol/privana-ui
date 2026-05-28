import { useMemo, type ReactNode } from 'react'
import { useTurnkey } from '@turnkey/react-wallet-kit'
import { ConnectWalletContext, type ConnectWalletContextValue } from './ConnectWalletContext'
import { IS_TURNKEY_ENABLED } from '../TurnkeyAuthProvider'

// Mounted inside TurnkeyProvider so it can call useTurnkey(). Exposes the
// connect action (Turnkey's auth modal) through context so the header button and
// page CTAs don't each need to call useTurnkey directly (which would throw when
// Turnkey isn't configured).
const TurnkeyConnect = ({ children }: { children: ReactNode }) => {
  const { handleLogin } = useTurnkey()
  const value = useMemo<ConnectWalletContextValue>(
    () => ({ connectWallet: () => void handleLogin() }),
    [handleLogin],
  )
  return <ConnectWalletContext.Provider value={value}>{children}</ConnectWalletContext.Provider>
}

// Turnkey isn't configured → no way to connect; provide a no-op.
const DISABLED_VALUE: ConnectWalletContextValue = { connectWallet: () => {} }

export const ConnectWalletProvider = ({ children }: { children: ReactNode }) => {
  if (!IS_TURNKEY_ENABLED) {
    return <ConnectWalletContext.Provider value={DISABLED_VALUE}>{children}</ConnectWalletContext.Provider>
  }
  return <TurnkeyConnect>{children}</TurnkeyConnect>
}
