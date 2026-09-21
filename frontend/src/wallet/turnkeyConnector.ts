import { createConnector } from 'wagmi'
import { getAddress, type Chain, type EIP1193Provider } from 'viem'
import { getTurnkeyActiveWallet } from './turnkeyBridge'
import { createEmbeddedEip1193Provider } from './embeddedEip1193Provider'

export const TURNKEY_CONNECTOR_ID = 'turnkeyEmbedded'

// Adapted from Turnkey's wagmi-demo
// (https://github.com/tkhq/wagmi-demo/blob/main/src/lib/connector.ts).
// Turnkey hasn't shipped an official wagmi connector yet — the demo is
// embedded-only and Sepolia-only, so this generalizes for multi-chain and
// adds the connected-wallet (external) path.
//
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

    // EIP-3085 error for a chain the wallet has never seen; MetaMask mobile
    // reports it under a generic code, so match the message too.
    const isUnrecognizedChain = (err: unknown): boolean =>
      typeof err === 'object' &&
      err !== null &&
      ((err as { code?: unknown }).code === 4902 ||
        /unrecognized chain/i.test(String((err as { message?: unknown }).message ?? '')))

    async function switchOrAddProviderChain(chain: Chain): Promise<void> {
      try {
        await switchProviderChain(chain.id)
      } catch (err) {
        if (!isUnrecognizedChain(err)) throw err
        const p = await ensureProvider()
        await p.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${chain.id.toString(16)}`,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: chain.rpcUrls.default.http,
              blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : undefined,
            },
          ],
        })
        const actual = Number(await p.request({ method: 'eth_chainId' }))
        if (actual === chain.id) connectedChainId = chain.id
        else await switchProviderChain(chain.id)
      }
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
        if (chainId != null) {
          try {
            await switchProviderChain(chainId)
          } catch {
            // stay on the wallet's current chain
          }
        }
        if (active.kind === 'connected') {
          const actual = (await provider.request({ method: 'eth_chainId' })) as `0x${string}`
          connectedChainId = Number(actual)
          subscribe(provider)
        }
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
        await switchOrAddProviderChain(chain)
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
