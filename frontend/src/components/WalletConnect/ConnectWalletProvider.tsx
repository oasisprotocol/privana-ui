import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useTurnkey, WalletInterfaceType } from '@turnkey/react-wallet-kit'
import type { EIP1193Provider } from 'viem'
import { setTurnkeyWalletIntent } from '@/wallet/turnkeyIntent'
import { setTurnkeyActiveWallet } from '@/wallet/turnkeyBridge'
import { extractErrorMessage } from '@/lib/errors'
import { ConnectWalletContext, type ConnectWalletContextValue } from './ConnectWalletContext'
import { SignInDialog, type ExternalWalletOption } from './SignInDialog'
import { IS_TURNKEY_ENABLED } from '../TurnkeyAuthProvider'

// Stable identity per injected wallet; falls back to uuid/name.
const providerKey = (p: { info: { rdns?: string; uuid?: string; name: string } }): string =>
  p.info.rdns ?? p.info.uuid ?? p.info.name

// Mounted inside TurnkeyProvider so it can call useTurnkey(). Exposes a single
// signIn() action through context (so the header button and page CTAs don't each
// need to call useTurnkey directly, which would throw when Turnkey isn't
// configured). signIn() opens one modal offering both paths:
//  - email / passkey / social → hands off to Turnkey's own auth modal → embedded.
//  - a detected browser wallet → connectWalletAccount (no Turnkey login stamp),
//    marking the 'connected' intent; TurnkeySync bridges it to wagmi and SIWE
//    authenticates.
const TurnkeyConnect = ({ children }: { children: ReactNode }) => {
  const { handleLogin, walletProviders, connectWalletAccount } = useTurnkey()
  const [modalOpen, setModalOpen] = useState(false)
  const [connectingKey, setConnectingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Bumped to abandon an in-flight connect (cancel / close / new selection) so a
  // late-resolving promise can't hijack the UI or connect after the user moved on.
  const attemptRef = useRef(0)

  // Connectable external wallets: EVM only, one row per wallet (the same wallet
  // can appear once per chain).
  const providers = useMemo(() => {
    const seen = new Set<string>()
    const out: typeof walletProviders = []
    for (const p of walletProviders) {
      if (p.interfaceType === WalletInterfaceType.Solana) continue
      const key = providerKey(p)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(p)
    }
    return out
  }, [walletProviders])

  const options = useMemo<ExternalWalletOption[]>(
    () => providers.map(p => ({ key: providerKey(p), name: p.info.name, icon: p.info.icon })),
    [providers],
  )

  // WalletConnect needs its pairing QR rendered while connectWalletAccount is
  // pending. The connecting provider tells us whether we're in that case; the URI
  // lives on the live WalletConnect provider entry and refreshes reactively.
  const connectingProvider = connectingKey ? providers.find(p => providerKey(p) === connectingKey) : undefined
  const qrActive = connectingProvider?.interfaceType === WalletInterfaceType.WalletConnect
  const qrUri = walletProviders.find(p => p.interfaceType === WalletInterfaceType.WalletConnect)?.uri

  const handleSelect = async (key: string) => {
    const provider = providers.find(p => providerKey(p) === key)
    if (!provider) return
    const attempt = ++attemptRef.current
    setError(null)
    setConnectingKey(key)
    try {
      const account = await connectWalletAccount(provider)
      if (attemptRef.current !== attempt) return // cancelled / superseded
      // Publish the connected wallet to the bridge BEFORE flipping the intent:
      // without a Turnkey session connectWalletAccount never writes it into
      // `wallets`, so TurnkeySync reads it from the bridge instead. The
      // null→'connected' intent transition is what wakes TurnkeySync to connect wagmi.
      setTurnkeyActiveWallet({
        kind: 'connected',
        provider: provider.provider as EIP1193Provider,
        address: account.address as `0x${string}`,
      })
      setTurnkeyWalletIntent('connected')
      setModalOpen(false)
    } catch (err) {
      if (attemptRef.current !== attempt) return
      setError(extractErrorMessage(err))
    } finally {
      if (attemptRef.current === attempt) setConnectingKey(null)
    }
  }

  // Email / passkey stays entirely inside Turnkey's own modal — we just close
  // ours and hand off, never touching the email value.
  const handleEmailContinue = () => {
    setModalOpen(false)
    void handleLogin()
  }

  // Abandon any in-flight connect and return to the wallet list.
  const cancelConnecting = () => {
    attemptRef.current++
    setConnectingKey(null)
    setError(null)
  }

  const handleOpenChange = (open: boolean) => {
    setModalOpen(open)
    if (!open) cancelConnecting()
  }

  const value = useMemo<ConnectWalletContextValue>(() => ({ signIn: () => setModalOpen(true) }), [])

  return (
    <ConnectWalletContext.Provider value={value}>
      {children}
      <SignInDialog
        open={modalOpen}
        onOpenChange={handleOpenChange}
        onEmailContinue={handleEmailContinue}
        options={options}
        connectingKey={connectingKey}
        error={error}
        onSelect={key => void handleSelect(key)}
        qrActive={qrActive}
        qrUri={qrUri}
      />
    </ConnectWalletContext.Provider>
  )
}

// Turnkey isn't configured → no way to connect; provide a no-op.
const DISABLED_VALUE: ConnectWalletContextValue = { signIn: () => {} }

export const ConnectWalletProvider = ({ children }: { children: ReactNode }) => {
  if (!IS_TURNKEY_ENABLED) {
    return <ConnectWalletContext.Provider value={DISABLED_VALUE}>{children}</ConnectWalletContext.Provider>
  }
  return <TurnkeyConnect>{children}</TurnkeyConnect>
}
