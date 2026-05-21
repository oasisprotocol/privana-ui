import { useEffect, useRef } from 'react'
import {
  AuthState,
  ClientState,
  useTurnkey,
  WalletInterfaceType,
  WalletSource,
} from '@turnkey/react-wallet-kit'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import type { EIP1193Provider } from 'viem'
import { setTurnkeyActiveWallet } from '@/wallet/turnkeyBridge'
import { TURNKEY_CONNECTOR_ID } from '@/wallet/turnkeyConnector'
import type { AppChainId } from '@/wagmi-config'

const APP_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId

// Keeps wagmi in sync with the active Turnkey wallet — embedded or connected
// (external). Publishes the active wallet to the bridge, provisions an embedded
// wallet when a passkey/email signup has none, connects the single Turnkey wagmi
// connector, and disconnects on logout. Rendered only when Turnkey is enabled.
export const TurnkeySync = () => {
  const {
    authState,
    clientState,
    httpClient,
    session,
    wallets,
    walletProviders,
    createWallet,
    refreshWallets,
  } = useTurnkey()
  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { connector: activeConnector, isConnected } = useAccount()
  const connectingRef = useRef(false)
  const creatingWalletRef = useRef(false)

  const isTurnkeyActive = isConnected && activeConnector?.id === TURNKEY_CONNECTOR_ID

  useEffect(() => {
    if (authState === AuthState.Unauthenticated) {
      setTurnkeyActiveWallet(null)
      if (isTurnkeyActive) void disconnectAsync()
      return
    }
    if (authState !== AuthState.Authenticated) return

    // Don't act on session state until the Turnkey client has initialized.
    if (clientState !== ClientState.Ready) return

    const connectToWagmi = () => {
      if (isTurnkeyActive || connectingRef.current) return
      const connector = connectors.find(c => c.id === TURNKEY_CONNECTOR_ID)
      if (!connector) return
      connectingRef.current = true
      void connectAsync({ connector, chainId: APP_CHAIN_ID })
        .catch(err => console.error('[TurnkeySync] connect failed', err))
        .finally(() => {
          connectingRef.current = false
        })
    }

    // Connected (external) wallet: surface its own EIP-1193 provider to wagmi.
    const connectedWallet = wallets.find(w => w.source === WalletSource.Connected)
    if (connectedWallet) {
      const address = connectedWallet.accounts?.[0]?.address
      const walletProvider = walletProviders.find(
        p =>
          p.interfaceType !== WalletInterfaceType.Solana &&
          !!address &&
          p.connectedAddresses.some(a => a.toLowerCase() === address.toLowerCase()),
      )
      if (address && walletProvider) {
        setTurnkeyActiveWallet({
          kind: 'connected',
          provider: walletProvider.provider as EIP1193Provider,
          address: address as `0x${string}`,
        })
        connectToWagmi()
      }
      return
    }

    // Embedded wallet path needs the Turnkey client/session.
    if (!httpClient || !session?.organizationId) return
    const embeddedWallet = wallets.find(w => w.source === WalletSource.Embedded)
    const address = embeddedWallet?.accounts?.[0]?.address

    // Email/passkey signup creates a sub-org but not always a wallet — provision
    // an Ethereum embedded wallet on first sight. The wallets list updates
    // automatically, which re-runs this effect and falls through to connect.
    if (!embeddedWallet || !address) {
      if (!creatingWalletRef.current) {
        creatingWalletRef.current = true
        // The reactive `wallets` is transiently empty during rehydration even after
        // clientState is Ready, so re-fetch a definitive list and only provision
        // when the org genuinely has no wallets — otherwise we'd try to create a
        // wallet that already exists ("wallet label must be unique").
        void refreshWallets()
          .then(current => {
            if (current.length > 0) return
            return createWallet({ walletName: 'Privana', accounts: ['ADDRESS_FORMAT_ETHEREUM'] })
          })
          .catch(err => console.error('[TurnkeySync] createWallet failed', err))
          .finally(() => {
            creatingWalletRef.current = false
          })
      }
      return
    }

    setTurnkeyActiveWallet({
      kind: 'embedded',
      httpClient,
      organizationId: session.organizationId,
      walletId: embeddedWallet.walletId,
      address: address as `0x${string}`,
    })
    connectToWagmi()
  }, [
    authState,
    clientState,
    httpClient,
    session,
    wallets,
    walletProviders,
    isTurnkeyActive,
    createWallet,
    refreshWallets,
    connectAsync,
    disconnectAsync,
    connectors,
  ])

  return null
}
