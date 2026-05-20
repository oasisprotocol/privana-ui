import { createConfig, http } from 'wagmi'
import { sapphire, sapphireTestnet, baseSepolia } from 'viem/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { turnkeyConnector } from './wallet/turnkeyConnector'

const { VITE_WALLET_CONNECT_PROJECT_ID, VITE_TURNKEY_ORGANIZATION_ID } = import.meta.env

export const wagmiConfig = createConfig({
  chains: [sapphire, sapphireTestnet, baseSepolia],
  connectors: [
    injected(),
    walletConnect({ projectId: VITE_WALLET_CONNECT_PROJECT_ID }),
    ...(VITE_TURNKEY_ORGANIZATION_ID ? [turnkeyConnector()] : []),
  ],
  transports: {
    [sapphire.id]: http(),
    [sapphireTestnet.id]: http(),
    [baseSepolia.id]: http(),
  },
  batch: {
    multicall: false,
  },
  ssr: false,
})

export type AppChainId = (typeof wagmiConfig)['chains'][number]['id']

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
