import { useEffect, useRef } from 'react'
import { AuthState, useTurnkey, WalletSource } from '@turnkey/react-wallet-kit'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { setTurnkeySignerContext } from '@/wallet/turnkeyBridge'
import { TURNKEY_CONNECTOR_ID } from '@/wallet/turnkeyConnector'
import type { AppChainId } from '@/wagmi-config'

const APP_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId

// Keeps wagmi in sync with the Turnkey embedded-wallet session: publishes the
// signer context for the connector, connects wagmi after login, and disconnects
// on logout. Rendered only when Turnkey is enabled (inside TurnkeyProvider).
export const TurnkeySync = () => {
  const { authState, httpClient, session, wallets } = useTurnkey()
  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { connector: activeConnector, isConnected } = useAccount()
  const connectingRef = useRef(false)

  const isTurnkeyActive = isConnected && activeConnector?.id === TURNKEY_CONNECTOR_ID

  useEffect(() => {
    const wallet = wallets.find(w => w.source === WalletSource.Embedded) ?? wallets[0]
    const address = wallet?.accounts?.[0]?.address

    if (
      authState === AuthState.Authenticated &&
      httpClient &&
      session?.organizationId &&
      wallet?.walletId &&
      address
    ) {
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
          void connectAsync({ connector, chainId: APP_CHAIN_ID }).finally(() => {
            connectingRef.current = false
          })
        }
      }
      return
    }

    if (authState === AuthState.Unauthenticated) {
      setTurnkeySignerContext(null)
      if (isTurnkeyActive) void disconnectAsync()
    }
  }, [authState, httpClient, session, wallets, isTurnkeyActive, connectAsync, disconnectAsync, connectors])

  return null
}
