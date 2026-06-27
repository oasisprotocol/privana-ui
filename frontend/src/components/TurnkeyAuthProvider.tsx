import type { ReactNode } from 'react'
import { TurnkeyProvider } from '@turnkey/react-wallet-kit'
import '@turnkey/react-wallet-kit/styles.css'
import { setTurnkeyWalletIntent } from '@/wallet/turnkeyIntent'
import { wagmiConfig } from '@/wagmi-config'

const ORGANIZATION_ID = import.meta.env.VITE_TURNKEY_ORGANIZATION_ID
const AUTH_PROXY_CONFIG_ID = import.meta.env.VITE_TURNKEY_AUTH_PROXY_CONFIG_ID
const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID

const WALLET_CONNECT_NAMESPACES = wagmiConfig.chains.map(chain => `eip155:${chain.id}` as `eip155:${string}`)

// Whether the Turnkey embedded-wallet path is configured. Consumers (e.g. the
// wagmi sync component) gate on this so they don't call useTurnkey() when the
// provider isn't mounted.
export const IS_TURNKEY_ENABLED = !!ORGANIZATION_ID

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
        // External wallets are intentionally NOT offered as a Turnkey auth
        // method: wallet auth signs an ACTIVITY_TYPE_STAMP_LOGIN activity to
        // register the wallet as a Turnkey authenticator, which external wallets
        // surface as an unreadable "Unknown Signature Type" prompt. We connect
        // them through Turnkey's *connecting* feature instead (connectWalletAccount,
        // no stamp) and authenticate the app with SIWE. So this modal only does
        // email / passkey / social → embedded wallet.
        ui: {
          authModal: { methods: { walletAuthEnabled: false } },
          borderRadius: 16,
          colors: {
            light: {
              primary: '#fcd34d',
              primaryText: '#25292e',
              button: '#fcd34d',
              modalBackground: '#f2f2f2',
            },
          },
        },
        // Surface external wallets for *connecting* (provider discovery via
        // `walletProviders` + connectWalletAccount). `auth` is off so wallets are
        // never used as a Turnkey login method — see the authModal note above.
        walletConfig: {
          features: { auth: false, connecting: true },
          chains: {
            ethereum: { native: true, walletConnectNamespaces: WALLET_CONNECT_NAMESPACES },
          },
          ...(WALLET_CONNECT_PROJECT_ID && {
            walletConnect: {
              projectId: WALLET_CONNECT_PROJECT_ID,
              appMetadata: {
                name: 'Privana',
                description: 'Your private corner of DeFi.',
                url: window.location.origin,
                icons: [`${window.location.origin}/favicon.png`],
              },
            },
          }),
        },
      }}
      callbacks={{
        onAuthenticationSuccess: () => setTurnkeyWalletIntent('embedded'),
      }}
    >
      {children}
    </TurnkeyProvider>
  )
}
