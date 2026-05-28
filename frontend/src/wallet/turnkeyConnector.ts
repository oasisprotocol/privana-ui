import { createConnector } from 'wagmi'
import { getAddress, type EIP1193Provider } from 'viem'
import { getTurnkeyActiveWallet } from './turnkeyBridge'
import { createEmbeddedEip1193Provider } from './embeddedEip1193Provider'

export const TURNKEY_CONNECTOR_ID = 'turnkeyEmbedded'

// Bridges active Turnkey wallet into wagmi. For an embedded wallet it builds
// a @turnkey/viem-backed EIP-1193 provider from the runtime signer context; for
// a connected (external) wallet it uses that wallet's own provider directly.
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
        embeddedProvider = createEmbeddedEip1193Provider(active, {
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
