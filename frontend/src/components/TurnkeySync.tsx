import { useEffect, useRef } from 'react'
import { AuthState, useTurnkey, WalletSource } from '@turnkey/react-wallet-kit'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { setTurnkeySignerContext } from '@/wallet/turnkeyBridge'
import { TURNKEY_CONNECTOR_ID } from '@/wallet/turnkeyConnector'
import type { AppChainId } from '@/wagmi-config'

const APP_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId

// Keeps wagmi in sync with the Turnkey embedded-wallet session: provisions an
// Ethereum wallet if the authenticated user has none, publishes the signer
// context for the connector, connects wagmi after login, and disconnects on
// logout. Rendered only when Turnkey is enabled (inside TurnkeyProvider).
export const TurnkeySync = () => {
  const { authState, httpClient, session, wallets, createWallet } = useTurnkey()
  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { connector: activeConnector, isConnected } = useAccount()
  const connectingRef = useRef(false)
  const creatingWalletRef = useRef(false)

  const isTurnkeyActive = isConnected && activeConnector?.id === TURNKEY_CONNECTOR_ID

  useEffect(() => {
    if (authState === AuthState.Unauthenticated) {
      setTurnkeySignerContext(null)
      if (isTurnkeyActive) void disconnectAsync()
      return
    }

    if (authState !== AuthState.Authenticated || !httpClient || !session?.organizationId) return

    const wallet = wallets.find(w => w.source === WalletSource.Embedded) ?? wallets[0]
    const address = wallet?.accounts?.[0]?.address

    // Email/passkey signup creates a sub-org but not always a wallet — provision
    // an Ethereum embedded wallet on first sight. The wallets list updates
    // automatically, which re-runs this effect and falls through to connect.
    if (!wallet || !address) {
      if (wallets.length === 0 && !creatingWalletRef.current) {
        creatingWalletRef.current = true
        void createWallet({ walletName: 'Privana', accounts: ['ADDRESS_FORMAT_ETHEREUM'] })
          .catch(err => console.error('[TurnkeySync] createWallet failed', err))
          .finally(() => {
            creatingWalletRef.current = false
          })
      }
      return
    }

    setTurnkeySignerContext({
      httpClient,
      organizationId: session.organizationId,
      walletId: wallet.walletId,
      address: address as `0x${string}`,
    })

    if (!isTurnkeyActive && !connectingRef.current) {
      const connector = connectors.find(c => c.id === TURNKEY_CONNECTOR_ID)
      if (connector) {
        connectingRef.current = true
        void connectAsync({ connector, chainId: APP_CHAIN_ID })
          .catch(err => console.error('[TurnkeySync] connect failed', err))
          .finally(() => {
            connectingRef.current = false
          })
      }
    }
  }, [
    authState,
    httpClient,
    session,
    wallets,
    isTurnkeyActive,
    createWallet,
    connectAsync,
    disconnectAsync,
    connectors,
  ])

  return null
}
