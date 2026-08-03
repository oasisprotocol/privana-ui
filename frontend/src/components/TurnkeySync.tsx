import { useEffect, useRef } from 'react'
import { AuthState, ClientState, useTurnkey, WalletSource } from '@turnkey/react-wallet-kit'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { clearTurnkeyWallet, getTurnkeyActiveWallet, setTurnkeyActiveWallet } from '@/wallet/turnkeyBridge'
import { getConnectedWalletRecord } from '@/wallet/turnkeyConnectedWallet'
import { useTurnkeyWalletIntent } from '@/wallet/turnkeyIntent'
import { TURNKEY_CONNECTOR_ID } from '@/wallet/turnkeyConnector'
import type { AppChainId } from '@/wagmi-config'

const APP_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId

export const TurnkeySync = () => {
  const { authState, clientState, httpClient, session, wallets, createWallet, refreshWallets } = useTurnkey()
  const intent = useTurnkeyWalletIntent()
  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { connector: activeConnector, isConnected } = useAccount()
  const connectingRef = useRef(false)
  const creatingWalletRef = useRef(false)

  const isTurnkeyActive = isConnected && activeConnector?.id === TURNKEY_CONNECTOR_ID

  useEffect(() => {
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

    // Connected (external) wallets never authenticate to Turnkey, so this path
    // runs independently of authState. The connect flow (ConnectWalletProvider)
    // populates the bridge from connectWalletAccount's result — we can't re-derive
    // it from `wallets` here because, without a Turnkey session, connectWalletAccount
    // never writes the connected wallet into that state. So we just bridge to wagmi
    // when the connected wallet is present. Sign-out clears the intent, dropping us
    // into the teardown below.
    if (intent === 'connected') {
      if (getTurnkeyActiveWallet()?.kind === 'connected') connectToWagmi()
      return
    }

    // Embedded wallets are Turnkey-custodied → they require a Turnkey session.
    if (authState === AuthState.Unauthenticated) {
      if (getConnectedWalletRecord()) return
      clearTurnkeyWallet()
      if (isTurnkeyActive) void disconnectAsync()
      return
    }
    if (authState !== AuthState.Authenticated) return

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
