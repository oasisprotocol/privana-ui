import { sapphire, sapphireTestnet, base, mainnet, hyperEvm, baseSepolia, sepolia } from 'viem/chains'

// Single source for the app's chain set: wagmi-config registers these and the
// CSP build (security-headers.ts) derives connect-src RPC origins from their
// default RPC urls, so a viem upgrade or chain change updates both together.
export const APP_CHAINS = [sapphire, sapphireTestnet, base, mainnet, hyperEvm, baseSepolia, sepolia] as const
