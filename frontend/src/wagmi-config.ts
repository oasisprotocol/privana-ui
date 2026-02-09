import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sapphire, sapphireTestnet, baseSepolia } from 'viem/chains'

const { VITE_WALLET_CONNECT_PROJECT_ID } = import.meta.env

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getDefaultConfig>
  }
}

export const wagmiConfig: ReturnType<typeof getDefaultConfig> = getDefaultConfig({
  appName: 'Flex Vaults',
  projectId: VITE_WALLET_CONNECT_PROJECT_ID,
  chains: [sapphire, sapphireTestnet, baseSepolia],
  ssr: false,
  batch: {
    multicall: false,
  },
})
