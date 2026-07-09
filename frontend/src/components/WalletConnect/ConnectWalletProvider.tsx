import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useTurnkey, WalletInterfaceType } from '@turnkey/react-wallet-kit'
import type { EIP1193Provider } from 'viem'
import { setConnectedTurnkeyWallet } from '@/wallet/turnkeyBridge'
import { walletConnectToEip1193 } from '@/wallet/walletConnectEip1193'
import { extractErrorMessage } from '@/lib/errors'
import { ConnectWalletContext, type ConnectWalletContextValue } from './ConnectWalletContext'
import { type ExternalWalletOption, type SignInFormState } from './SignInForm'
import { IS_TURNKEY_ENABLED } from '../TurnkeyAuthProvider'

// Stable identity per injected wallet; falls back to uuid/name.
const providerKey = (p: { info: { rdns?: string; uuid?: string; name: string } }): string =>
  p.info.rdns ?? p.info.uuid ?? p.info.name

// Mounted inside TurnkeyProvider so it can call useTurnkey(). Produces the live
// `signInForm` state consumed by the login page ("/"), offering both paths:
//  - email / passkey / social → hands off to Turnkey's own auth modal → embedded.
//  - a detected browser wallet → connectWalletAccount (no Turnkey login stamp),
//    marking the 'connected' intent; TurnkeySync bridges it to wagmi and SIWE
//    authenticates.
const TurnkeyConnect = ({ children }: { children: ReactNode }) => {
  const { handleLogin, walletProviders, connectWalletAccount } = useTurnkey()
  const [connectingKey, setConnectingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Bumped to abandon an in-flight connect (cancel / new selection) so a
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
      // Turnkey hands back one of several provider shapes (injected EIP-1193 vs.
      // WalletConnect's Wallet-Standard surface). Solana is filtered out above, so
      // the only non-EIP-1193 case left is WalletConnect, which we adapt to EIP-1193
      // before publishing — otherwise the wagmi connector's `provider.on(...)` throws.
      const rpcProvider =
        provider.interfaceType === WalletInterfaceType.WalletConnect
          ? walletConnectToEip1193(provider.provider as Parameters<typeof walletConnectToEip1193>[0])
          : (provider.provider as EIP1193Provider)
      // connectWalletAccount never writes into Turnkey's `wallets` without a session,
      // so TurnkeySync reads the wallet from the bridge — publish it (and flip the
      // intent that wakes TurnkeySync) as one atomic step.
      setConnectedTurnkeyWallet({
        provider: rpcProvider,
        address: account.address as `0x${string}`,
      })
    } catch (err) {
      if (attemptRef.current !== attempt) return
      setError(extractErrorMessage(err))
    } finally {
      if (attemptRef.current === attempt) setConnectingKey(null)
    }
  }

  // Email / passkey hands off entirely to Turnkey's own modal — we never touch
  // the email value.
  const handleEmailContinue = () => {
    void handleLogin()
  }

  // Abandon any in-flight connect and return to the wallet list.
  const cancelConnecting = () => {
    attemptRef.current++
    setConnectingKey(null)
    setError(null)
  }

  const signInForm: SignInFormState = {
    onEmailContinue: handleEmailContinue,
    options,
    connectingKey,
    error,
    onSelect: key => void handleSelect(key),
    onCancel: cancelConnecting,
    qrActive,
    qrUri,
  }

  const value: ConnectWalletContextValue = { signInForm }

  return <ConnectWalletContext.Provider value={value}>{children}</ConnectWalletContext.Provider>
}

// Turnkey isn't configured. No way to connect; provide a no-op + empty form.
const DISABLED_VALUE: ConnectWalletContextValue = {
  signInForm: {
    onEmailContinue: () => {},
    options: [],
    connectingKey: null,
    error: null,
    onSelect: () => {},
    onCancel: () => {},
    qrActive: false,
    qrUri: undefined,
  },
}

export const ConnectWalletProvider = ({ children }: { children: ReactNode }) => {
  if (!IS_TURNKEY_ENABLED) {
    return <ConnectWalletContext.Provider value={DISABLED_VALUE}>{children}</ConnectWalletContext.Provider>
  }
  return <TurnkeyConnect>{children}</TurnkeyConnect>
}
