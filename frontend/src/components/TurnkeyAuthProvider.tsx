import type { ReactNode } from 'react'
import { TurnkeyProvider } from '@turnkey/react-wallet-kit'
import '@turnkey/react-wallet-kit/styles.css'

const ORGANIZATION_ID = import.meta.env.VITE_TURNKEY_ORGANIZATION_ID
const AUTH_PROXY_CONFIG_ID = import.meta.env.VITE_TURNKEY_AUTH_PROXY_CONFIG_ID

export const TurnkeyAuthProvider = ({ children }: { children: ReactNode }) => {
  if (!ORGANIZATION_ID) {
    if (import.meta.env.DEV) {
      console.warn('VITE_TURNKEY_ORGANIZATION_ID is not set — Turnkey embedded wallet disabled.')
    }
    return <>{children}</>
  }

  return (
    <TurnkeyProvider
      config={{
        organizationId: ORGANIZATION_ID,
        authProxyConfigId: AUTH_PROXY_CONFIG_ID,
      }}
    >
      {children}
    </TurnkeyProvider>
  )
}
