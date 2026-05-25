import { createConnector } from 'wagmi'
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
import { getTurnkeyActiveWallet, type TurnkeyActiveWallet } from './turnkeyBridge'

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

export const TURNKEY_CONNECTOR_ID = 'turnkeyEmbedded'

function createEmbeddedProvider(
  active: Extract<TurnkeyActiveWallet, { kind: 'embedded' }>,
  ctx: { chains: readonly Chain[]; getChainId: () => number },
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

  // The embedded wallet emits no standard EIP-1193 events.
  const noop = () => {}
  return { request, on: noop, removeListener: noop } as unknown as EIP1193Provider
}

// Bridges active Turnkey wallet into wagmi. For an embedded wallet it builds
// a @turnkey/viem-backed EIP-1193 provider from the runtime signer context; for a
// connected (external) wallet it uses that wallet's own provider directly.
// Connecting and disconnecting are driven by TurnkeySync, not a direct wagmi connect.
export function turnkeyConnector() {
  return createConnector<EIP1193Provider>(config => {
    let embeddedProvider: EIP1193Provider | undefined
    let embeddedKey: string | undefined
    let connectedChainId = config.chains[0].id

    async function ensureProvider(): Promise<EIP1193Provider> {
      const active = getTurnkeyActiveWallet()
      if (!active) throw new Error('Turnkey wallet not available')
      if (active.kind === 'connected') return active.provider
      const key = `${active.organizationId}:${active.walletId}`
      if (!embeddedProvider || embeddedKey !== key) {
        embeddedProvider = createEmbeddedProvider(active, {
          chains: config.chains,
          getChainId: () => connectedChainId,
        })
        embeddedKey = key
      }
      return embeddedProvider
    }

    async function switchProviderChain(chainId: number): Promise<void> {
      const p = await ensureProvider()
      await p.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
      connectedChainId = chainId
    }

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
        await switchProviderChain(chainId ?? connectedChainId).catch(() => {})
        if (active.kind === 'connected') subscribe(provider)
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
