import { createConnector } from 'wagmi'
import {
  createPublicClient,
  getAddress,
  hashMessage,
  http,
  numberToHex,
  type AddEthereumChainParameter,
  type Chain,
  type EIP1193Provider,
  type Hex,
} from 'viem'
import { createEIP1193Provider } from '@turnkey/eip-1193-provider'
import { getTurnkeySignerContext } from './turnkeyBridge'

type SendTxRequest = { from: Hex; to?: Hex; data?: Hex; value?: Hex }

export const TURNKEY_CONNECTOR_ID = 'turnkeyEmbedded'

function toChainParam(chain: Chain): AddEthereumChainParameter {
  return {
    chainId: `0x${chain.id.toString(16)}`,
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: chain.rpcUrls.default.http,
    blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : undefined,
  }
}

// The Turnkey eip-1193-provider has gaps a normal wallet fills in. We patch them
// in this wrapper (scoped to the Turnkey connector, so external wallets are
// unaffected):
//   - personal_sign/eth_sign: it signs with HASH_FUNCTION_NO_OP (expects a
//     32-byte digest) and does NOT apply the EIP-191 prefix, so we pre-hash.
//   - eth_sendTransaction: it BigInt()s gas/nonce/fees that viem doesn't send
//     for a JSON-RPC account, so we populate them (nonce/gas/fees/value/chainId)
//     before delegating — the prep a normal wallet would do.
function wrapTurnkeyProvider(
  provider: EIP1193Provider,
  ctx: { chains: readonly Chain[]; getChainId: () => number },
): EIP1193Provider {
  const original = provider.request.bind(provider) as (args: {
    method: string
    params?: unknown[]
  }) => Promise<unknown>

  async function prepareSendTransaction(tx: SendTxRequest): Promise<Record<string, Hex>> {
    const chain = ctx.chains.find(c => c.id === ctx.getChainId())
    if (!chain) throw new Error(`Chain ${ctx.getChainId()} is not configured`)
    const publicClient = createPublicClient({ chain, transport: http() })
    const value = tx.value ? BigInt(tx.value) : 0n
    const [nonce, gas, fees] = await Promise.all([
      publicClient.getTransactionCount({ address: tx.from, blockTag: 'pending' }),
      publicClient.estimateGas({ account: tx.from, to: tx.to, data: tx.data, value }),
      publicClient.estimateFeesPerGas(),
    ])
    const full: Record<string, Hex> = {
      from: tx.from,
      value: numberToHex(value),
      gas: numberToHex(gas),
      nonce: numberToHex(nonce),
      chainId: numberToHex(chain.id),
      maxFeePerGas: numberToHex(fees.maxFeePerGas),
      maxPriorityFeePerGas: numberToHex(fees.maxPriorityFeePerGas),
    }
    if (tx.to) full.to = tx.to
    if (tx.data) full.data = tx.data
    return full
  }

  provider.request = (async (args: { method: string; params?: unknown[] }) => {
    if (args.method === 'personal_sign') {
      const [message, address] = (args.params ?? []) as [Hex, Hex]
      return original({ method: 'personal_sign', params: [hashMessage({ raw: message }), address] })
    }
    if (args.method === 'eth_sign') {
      const [address, message] = (args.params ?? []) as [Hex, Hex]
      return original({ method: 'eth_sign', params: [address, hashMessage({ raw: message })] })
    }
    if (args.method === 'eth_signTypedData_v4') {
      // viem sends the typed data as a JSON string; the provider's
      // hashTypedData() expects an object, so parse it before delegating.
      const [address, typedData] = (args.params ?? []) as [Hex, unknown]
      const parsed = typeof typedData === 'string' ? JSON.parse(typedData) : typedData
      return original({ method: 'eth_signTypedData_v4', params: [address, parsed] })
    }
    if (args.method === 'eth_sendTransaction') {
      const [tx] = (args.params ?? []) as [SendTxRequest]
      return original({ method: 'eth_sendTransaction', params: [await prepareSendTransaction(tx)] })
    }
    return original(args)
  }) as EIP1193Provider['request']
  return provider
}

// Bridges the Turnkey embedded wallet into wagmi. The Turnkey EIP-1193 provider
// is built lazily from the runtime signer context (see turnkeyBridge); once
// built, the rest of the app and the Privana SDK talk to it through standard
// wagmi/viem hooks. Connecting/disconnecting is driven by TurnkeySync, not a
// direct wagmi connect.
export function turnkeyConnector() {
  return createConnector<EIP1193Provider>(config => {
    let provider: EIP1193Provider | undefined
    let providerKey: string | undefined
    let connectedChainId = config.chains[0].id

    async function ensureProvider(): Promise<EIP1193Provider> {
      const ctx = getTurnkeySignerContext()
      if (!ctx) throw new Error('Turnkey session not available')
      const key = `${ctx.organizationId}:${ctx.walletId}`
      if (!provider || providerKey !== key) {
        // walletId/organizationId are branded UUIDs and turnkeyClient's public
        // type is narrower than what the provider accepts at runtime, so cast
        // the whole options object. See the eip-1193-provider notes in the plan.
        const options = {
          walletId: ctx.walletId,
          organizationId: ctx.organizationId,
          turnkeyClient: ctx.httpClient,
          chains: config.chains.map(toChainParam),
        } as unknown as Parameters<typeof createEIP1193Provider>[0]
        provider = wrapTurnkeyProvider((await createEIP1193Provider(options)) as unknown as EIP1193Provider, {
          chains: config.chains,
          getChainId: () => connectedChainId,
        })
        providerKey = key
      }
      return provider
    }

    // Drive the provider's active chain. eth_sendTransaction signs + broadcasts
    // on the provider's activeChain, so this must run before any cross-chain tx
    // (e.g. a Base Sepolia deposit while the app sits on Sapphire).
    async function switchProviderChain(chainId: number): Promise<void> {
      const p = await ensureProvider()
      await p.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
      connectedChainId = chainId
    }

    return {
      id: TURNKEY_CONNECTOR_ID,
      name: 'Turnkey',
      type: 'turnkey',

      async connect({ chainId } = {}) {
        const ctx = getTurnkeySignerContext()
        if (!ctx) throw new Error('Turnkey session not available')
        // Build the provider now so getProvider() (used for signing) is ready.
        // The address comes from the session, so connecting needs no extra prompt.
        await ensureProvider()
        // Align the provider's active chain with the requested chain so the first
        // tx targets the right network.
        await switchProviderChain(chainId ?? connectedChainId)
        // `as never` satisfies wagmi's `withCapabilities` conditional return type;
        // the runtime value is just the address array.
        return { accounts: [getAddress(ctx.address)] as never, chainId: connectedChainId }
      },

      async disconnect() {
        provider = undefined
        providerKey = undefined
      },

      async getAccounts() {
        const ctx = getTurnkeySignerContext()
        return ctx ? [getAddress(ctx.address)] : []
      },

      async getChainId() {
        return connectedChainId
      },

      async getProvider() {
        return ensureProvider()
      },

      async isAuthorized() {
        return !!getTurnkeySignerContext()
      },

      async switchChain({ chainId }) {
        const chain = config.chains.find(c => c.id === chainId)
        if (!chain) throw new Error(`Chain ${chainId} is not configured`)
        await switchProviderChain(chainId)
        config.emitter.emit('change', { chainId })
        return chain
      },

      onAccountsChanged(accounts) {
        if (accounts.length === 0) config.emitter.emit('disconnect')
        else config.emitter.emit('change', { accounts: accounts.map(a => getAddress(a)) })
      },

      onChainChanged(chainId) {
        connectedChainId = Number(chainId)
        config.emitter.emit('change', { chainId: connectedChainId })
      },

      onDisconnect() {
        provider = undefined
        providerKey = undefined
        config.emitter.emit('disconnect')
      },
    }
  })
}
