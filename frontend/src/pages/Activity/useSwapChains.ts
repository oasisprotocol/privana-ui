import { usePrivanaContext } from '@oasisprotocol/privana-sdk'

// The chains on either side of a swap: they tell apart tokens sharing a
// symbol, like USDC on Base and on HyperEVM.
export function useSwapChains(
  fromTokenId: string | null | undefined,
  toTokenId: string | null | undefined,
): { from?: string; to?: string } {
  const { getTokenById, getChainById } = usePrivanaContext()
  const chainOf = (tokenId: string | null | undefined) => {
    const token = tokenId ? getTokenById(tokenId) : undefined
    return token ? getChainById(token.chainId)?.name : undefined
  }
  return { from: chainOf(fromTokenId), to: chainOf(toTokenId) }
}
