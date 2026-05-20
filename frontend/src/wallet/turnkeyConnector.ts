import { createConnector } from 'wagmi'
import { getAddress, type AddEthereumChainParameter, type Chain, type EIP1193Provider } from 'viem'
import { createEIP1193Provider } from '@turnkey/eip-1193-provider'
import { getTurnkeySignerContext } from './turnkeyBridge'

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

// Bridges the Turnkey embedded wallet into wagmi. The Turnkey EIP-1193 provider
// is built lazily from the runtime signer context (see turnkeyBridge); once
// built, the rest of the app and the Privana SDK talk to it through standard
// wagmi/viem hooks. Connecting/disconnecting is driven by TurnkeySync, not the
// RainbowKit modal.
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
        provider = (await createEIP1193Provider(options)) as unknown as EIP1193Provider
        providerKey = key
      }
      return provider
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
        if (chainId) connectedChainId = chainId
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
        connectedChainId = chainId
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
