import { createConfig, http } from 'wagmi'
import { sapphire, sapphireTestnet, base, mainnet, hyperEvm, baseSepolia, sepolia } from 'viem/chains'
import { turnkeyConnector } from './wallet/turnkeyConnector'

const { VITE_TURNKEY_ORGANIZATION_ID } = import.meta.env

export const wagmiConfig = createConfig({
  // Every chain deposits can source from, both networks: wagmi reads the
  // connected wallet's balance and drives the chain switch per token chain
  // (SDK DepositView), and silently returns nothing for unregistered chains.
  chains: [sapphire, sapphireTestnet, base, mainnet, hyperEvm, baseSepolia, sepolia],
  // Every wallet — embedded and external — connects through Turnkey's modal and
  // is bridged into wagmi by the single Turnkey connector. EIP-6963 discovery is
  // disabled so wagmi doesn't auto-add injected wallets that would bypass it.
  multiInjectedProviderDiscovery: false,
  connectors: VITE_TURNKEY_ORGANIZATION_ID ? [turnkeyConnector()] : [],
  transports: {
    [sapphire.id]: http(),
    [sapphireTestnet.id]: http(),
    [base.id]: http(),
    [mainnet.id]: http(),
    [hyperEvm.id]: http(),
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
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
