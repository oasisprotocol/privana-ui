import { createConfig, http } from 'wagmi'
import { sapphire, sapphireTestnet, baseSepolia } from 'viem/chains'
import { walletConnect } from 'wagmi/connectors'
import { turnkeyConnector } from './wallet/turnkeyConnector'

const { VITE_WALLET_CONNECT_PROJECT_ID, VITE_TURNKEY_ORGANIZATION_ID } = import.meta.env

export const wagmiConfig = createConfig({
  chains: [sapphire, sapphireTestnet, baseSepolia],
  // Browser-extension wallets are auto-discovered via EIP-6963 (named entries
  // like MetaMask/Rabby), so we don't register a generic injected() connector —
  // that would show a duplicate "Injected" alongside each discovered wallet.
  connectors: [
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
