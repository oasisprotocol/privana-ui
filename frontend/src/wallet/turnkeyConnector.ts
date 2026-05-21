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
import { getTurnkeyActiveWallet } from './turnkeyBridge'

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
//   - personal_sign: it signs with HASH_FUNCTION_NO_OP (expects a 32-byte
//     digest) and does NOT apply the EIP-191 prefix, so we pre-hash.
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

// Bridges the active Turnkey wallet into wagmi. For an embedded wallet it builds
// a patched EIP-1193 provider from the runtime signer context; for a connected
// (external) wallet it uses that wallet's own provider directly. Connecting and
// disconnecting are driven by TurnkeySync, not a direct wagmi connect.
export function turnkeyConnector() {
  return createConnector<EIP1193Provider>(config => {
    let embeddedProvider: EIP1193Provider | undefined
    let embeddedKey: string | undefined
    let connectedChainId = config.chains[0].id

    async function ensureProvider(): Promise<EIP1193Provider> {
      const active = getTurnkeyActiveWallet()
      if (!active) throw new Error('Turnkey wallet not available')
      // Connected (external) wallets are already standard EIP-1193 providers.
      if (active.kind === 'connected') return active.provider
      // Embedded: build + patch lazily, cached by org:walletId.
      const key = `${active.organizationId}:${active.walletId}`
      if (!embeddedProvider || embeddedKey !== key) {
        // walletId/organizationId are branded UUIDs and turnkeyClient's public
        // type is narrower than what the provider accepts at runtime, so cast
        // the whole options object. See the eip-1193-provider notes in the plan.
        const options = {
          walletId: active.walletId,
          organizationId: active.organizationId,
          turnkeyClient: active.httpClient,
          chains: config.chains.map(toChainParam),
        } as unknown as Parameters<typeof createEIP1193Provider>[0]
        embeddedProvider = wrapTurnkeyProvider(
          (await createEIP1193Provider(options)) as unknown as EIP1193Provider,
          { chains: config.chains, getChainId: () => connectedChainId },
        )
        embeddedKey = key
      }
      return embeddedProvider
    }

    // Drive the provider's active chain (via wallet_switchEthereumChain). For the
    // embedded provider this must run before any cross-chain tx, since it signs +
    // broadcasts on its activeChain; for connected wallets it asks the external
    // wallet to switch.
    async function switchProviderChain(chainId: number): Promise<void> {
      const p = await ensureProvider()
      await p.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
      connectedChainId = chainId
    }

    // Forward wallet-initiated events (account/chain change, disconnect) to wagmi.
    // Only wired for connected (external) wallets — their providers emit standard
    // EIP-1193 events. The embedded provider's chainChanged payload is non-standard
    // and we drive its chain ourselves, so it isn't subscribed.
    let subscribedProvider: EIP1193Provider | undefined
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) config.emitter.emit('disconnect')
      else config.emitter.emit('change', { accounts: accounts.map(a => getAddress(a)) })
    }
    const handleChainChanged = (chainId: string) => {
      connectedChainId = Number(chainId)
      config.emitter.emit('change', { chainId: connectedChainId })
    }
    const handleProviderDisconnect = () => config.emitter.emit('disconnect')

    function subscribe(p: EIP1193Provider) {
      if (subscribedProvider === p) return
      unsubscribe()
      p.on('accountsChanged', handleAccountsChanged)
      p.on('chainChanged', handleChainChanged)
      p.on('disconnect', handleProviderDisconnect)
      subscribedProvider = p
    }
    function unsubscribe() {
      if (!subscribedProvider) return
      subscribedProvider.removeListener('accountsChanged', handleAccountsChanged)
      subscribedProvider.removeListener('chainChanged', handleChainChanged)
      subscribedProvider.removeListener('disconnect', handleProviderDisconnect)
      subscribedProvider = undefined
    }

    return {
      id: TURNKEY_CONNECTOR_ID,
      name: 'Turnkey',
      type: 'turnkey',

      async connect({ chainId } = {}) {
        const active = getTurnkeyActiveWallet()
        if (!active) throw new Error('Turnkey wallet not available')
        const provider = await ensureProvider()
        // Align the provider's active chain with the requested chain so the first
        // tx targets the right network. Tolerate failures for connected wallets
        // (the external wallet may decline to switch).
        await switchProviderChain(chainId ?? connectedChainId).catch(() => {})
        // External wallets emit standard EIP-1193 events; forward them to wagmi.
        if (active.kind === 'connected') subscribe(provider)
        // `as never` satisfies wagmi's `withCapabilities` conditional return type;
        // the runtime value is just the address array.
        return { accounts: [getAddress(active.address)] as never, chainId: connectedChainId }
      },

      async disconnect() {
        unsubscribe()
        embeddedProvider = undefined
        embeddedKey = undefined
      },

      async getAccounts() {
        const active = getTurnkeyActiveWallet()
        return active ? [getAddress(active.address)] : []
      },

      async getChainId() {
        return connectedChainId
      },

      async getProvider() {
        return ensureProvider()
      },

      async isAuthorized() {
        return !!getTurnkeyActiveWallet()
      },

      async switchChain({ chainId }) {
        const chain = config.chains.find(c => c.id === chainId)
        if (!chain) throw new Error(`Chain ${chainId} is not configured`)
        await switchProviderChain(chainId)
        config.emitter.emit('change', { chainId })
        return chain
      },

      onAccountsChanged: handleAccountsChanged,

      onChainChanged: handleChainChanged,

      onDisconnect() {
        unsubscribe()
        embeddedProvider = undefined
        embeddedKey = undefined
        config.emitter.emit('disconnect')
      },
    }
  })
}
