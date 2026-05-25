import type { ReactNode } from 'react'
import { AuthMethod, TurnkeyProvider } from '@turnkey/react-wallet-kit'
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
        // Show "Continue with wallet" so external wallets connect through the
        // Turnkey modal too. (The Wallet method must also be enabled in the
        // Turnkey dashboard auth-proxy config for it to function.)
        ui: { authModal: { methods: { walletAuthEnabled: true } } },
        // Surface external wallets in the modal: injected (Rabby/MetaMask) via
        // `native`, plus WalletConnect when a project id is configured.
        walletConfig: {
          features: { auth: true, connecting: true },
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
        onAuthenticationSuccess: ({ method }) =>
          setTurnkeyWalletIntent(method === AuthMethod.Wallet ? 'connected' : 'embedded'),
      }}
    >
      {children}
    </TurnkeyProvider>
  )
}
