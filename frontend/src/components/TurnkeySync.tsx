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
import { setTurnkeyWalletIntent, useTurnkeyWalletIntent } from '@/wallet/turnkeyIntent'
import { TURNKEY_CONNECTOR_ID } from '@/wallet/turnkeyConnector'
import type { AppChainId } from '@/wagmi-config'

const APP_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId

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
  const intent = useTurnkeyWalletIntent()
  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { connector: activeConnector, isConnected } = useAccount()
  const connectingRef = useRef(false)
  const creatingWalletRef = useRef(false)

  const isTurnkeyActive = isConnected && activeConnector?.id === TURNKEY_CONNECTOR_ID

  useEffect(() => {
    if (clientState !== ClientState.Ready) return

    if (authState === AuthState.Unauthenticated) {
      setTurnkeyActiveWallet(null)
      setTurnkeyWalletIntent(null)
      if (isTurnkeyActive) void disconnectAsync()
      return
    }
    if (authState !== AuthState.Authenticated) return

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

    if (intent === 'connected') {
      const connectedWallet = wallets.find(w => w.source === WalletSource.Connected)
      const address = connectedWallet?.accounts?.[0]?.address
      if (!address) return
      const walletProvider = walletProviders.find(
        p =>
          p.interfaceType !== WalletInterfaceType.Solana &&
          p.connectedAddresses.some(a => a.toLowerCase() === address.toLowerCase()),
      )
      if (!walletProvider) return
      setTurnkeyActiveWallet({
        kind: 'connected',
        provider: walletProvider.provider as EIP1193Provider,
        address: address as `0x${string}`,
      })
      connectToWagmi()
      return
    }

    if (intent === 'embedded') {
      // Embedded wallet path needs the Turnkey client/session.
      if (!httpClient || !session?.organizationId) return
      const embeddedWallet = wallets.find(w => w.source === WalletSource.Embedded)
      const address = embeddedWallet?.accounts?.[0]?.address

      if (!embeddedWallet || !address) {
        if (!creatingWalletRef.current) {
          creatingWalletRef.current = true
          void refreshWallets()
            .then(list => {
              if (list.some(w => w.source === WalletSource.Embedded)) return
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
    }
  }, [
    authState,
    clientState,
    httpClient,
    session,
    wallets,
    walletProviders,
    intent,
    isTurnkeyActive,
    createWallet,
    refreshWallets,
    connectAsync,
    disconnectAsync,
    connectors,
  ])

  return null
}
