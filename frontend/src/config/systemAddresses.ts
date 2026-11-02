// System addresses the services stopped using. History still holds them as counterparties, so
// they stay system addresses: kept out of Recents and refused as recipients. swapLp also keeps
// their swap legs labeled as swaps in Activity. Add an address when it's retired, never remove one.
export const RETIRED_SYSTEM_ADDRESSES: Record<number, { address: string; swapLp?: true }[]> = {
  23294: [], // Sapphire mainnet
  23295: [], // Sapphire testnet
}

const retired = RETIRED_SYSTEM_ADDRESSES[parseInt(import.meta.env.VITE_CHAIN_ID, 10)] ?? []

export const RETIRED_ADDRESSES: string[] = retired.map(({ address }) => address.toLowerCase())

export const RETIRED_SWAP_LP_ADDRESSES: string[] = retired
  .filter(({ swapLp }) => swapLp)
  .map(({ address }) => address.toLowerCase())
