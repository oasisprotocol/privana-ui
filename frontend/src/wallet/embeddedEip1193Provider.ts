import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  numberToHex,
  type Chain,
  type EIP1193Provider,
  type Hex,
  type LocalAccount,
  type PublicClient,
  type Transport,
  type WalletClient,
} from 'viem'
import { createAccount } from '@turnkey/viem'
import { type TurnkeyActiveWallet } from './turnkeyBridge'

type SendTxRequest = {
  from?: Hex
  to?: Hex
  data?: Hex
  value?: Hex
  gas?: Hex
  gasPrice?: Hex
  maxFeePerGas?: Hex
  maxPriorityFeePerGas?: Hex
  nonce?: Hex
}

type EmbeddedActiveWallet = Extract<TurnkeyActiveWallet, { kind: 'embedded' }>

interface ProviderContext {
  chains: readonly Chain[]
  getChainId: () => number
}

// EIP-1193 provider backed by `@turnkey/viem` for a Turnkey-managed embedded
// wallet. Per-chain viem clients are cached so repeated RPCs on the same chain
// don't rebuild the transport. The embedded wallet has no real EIP-1193 events,
// so `on`/`removeListener` are noops — connectors wiring this provider should
// only subscribe events on external (connected) wallets.
export function createEmbeddedEip1193Provider(
  active: EmbeddedActiveWallet,
  ctx: ProviderContext,
): EIP1193Provider {
  let accountPromise: Promise<LocalAccount> | undefined
  const getAccount = () =>
    (accountPromise ??= createAccount({
      client: active.httpClient,
      organizationId: active.organizationId,
      signWith: active.address,
    }))

  const clientsByChain = new Map<
    number,
    { publicClient: PublicClient; walletClient: WalletClient<Transport, Chain, LocalAccount> }
  >()
  async function clientsFor(chainId: number) {
    const cached = clientsByChain.get(chainId)
    if (cached) return cached
    const chain = ctx.chains.find(c => c.id === chainId)
    if (!chain) throw new Error(`Chain ${chainId} is not configured`)
    const account = await getAccount()
    const publicClient = createPublicClient({ chain, transport: http() })
    const walletClient = createWalletClient({ account, chain, transport: http() })
    const clients = { publicClient, walletClient }
    clientsByChain.set(chainId, clients)
    return clients
  }

  const request = (async ({ method, params }: { method: string; params?: unknown[] }) => {
    const chainId = ctx.getChainId()
    switch (method) {
      case 'eth_accounts':
      case 'eth_requestAccounts':
        return [getAddress(active.address)]
      case 'eth_chainId':
        return numberToHex(chainId)
      case 'wallet_switchEthereumChain':
        return null
      case 'personal_sign': {
        const [message] = (params ?? []) as [Hex]
        const account = await getAccount()
        return account.signMessage({ message: { raw: message } })
      }
      case 'eth_signTypedData_v4': {
        const [, data] = (params ?? []) as [Hex, unknown]
        const account = await getAccount()
        const typedData = typeof data === 'string' ? JSON.parse(data) : data
        return account.signTypedData(typedData as Parameters<LocalAccount['signTypedData']>[0])
      }
      case 'eth_sendTransaction': {
        const [tx] = (params ?? []) as [SendTxRequest]
        const { walletClient } = await clientsFor(chainId)
        const toBig = (v?: Hex) => (v != null ? BigInt(v) : undefined)
        // Honor whatever the caller already populated (wagmi/viem fills gas, fees
        // and nonce before dispatching) instead of dropping it and re-estimating.
        return walletClient.sendTransaction({
          to: tx.to,
          data: tx.data,
          value: toBig(tx.value),
          gas: toBig(tx.gas),
          nonce: tx.nonce != null ? Number(tx.nonce) : undefined,
          // legacy or EIP-1559 fees, whichever was supplied (never both)
          ...(tx.gasPrice != null
            ? { gasPrice: BigInt(tx.gasPrice) }
            : {
                maxFeePerGas: toBig(tx.maxFeePerGas),
                maxPriorityFeePerGas: toBig(tx.maxPriorityFeePerGas),
              }),
        } as Parameters<typeof walletClient.sendTransaction>[0])
      }
      default: {
        const { publicClient } = await clientsFor(chainId)
        const forward = publicClient.request as unknown as (args: {
          method: string
          params?: unknown[]
        }) => Promise<unknown>
        return forward({ method, params })
      }
    }
  }) as EIP1193Provider['request']

  const noop = () => {}
  return { request, on: noop, removeListener: noop } as unknown as EIP1193Provider
}
