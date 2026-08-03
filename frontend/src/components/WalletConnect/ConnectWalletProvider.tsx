import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ClientState, useTurnkey, WalletInterfaceType } from '@turnkey/react-wallet-kit'
import { getAddress, type EIP1193Provider } from 'viem'
import { getTurnkeyActiveWallet, setConnectedTurnkeyWallet } from '@/wallet/turnkeyBridge'
import { getConnectedWalletRecord, setConnectedWalletRecord } from '@/wallet/turnkeyConnectedWallet'
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
  const { handleLogin, walletProviders, connectWalletAccount, clientState } = useTurnkey()
  const [connectingKey, setConnectingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Bumped to abandon an in-flight connect (cancel / new selection) so a
  // late-resolving promise can't hijack the UI or connect after the user moved on.
  const attemptRef = useRef(0)
  // Cancel only detaches *us* from the request — the wallet's own prompt stays
  // open, and injected wallets queue one unlock per origin, rejecting a second
  // with -32002 "Already processing". So keep the original promise and re-await
  // it if the user picks the same wallet again, rather than asking twice.
  const inFlightRef = useRef(new Map<string, ReturnType<typeof connectWalletAccount>>())

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

  const restoreAttemptedRef = useRef(false)
  useEffect(() => {
    if (clientState !== ClientState.Ready || restoreAttemptedRef.current) return
    const record = getConnectedWalletRecord()
    if (!record) return
    if (getTurnkeyActiveWallet()) return

    const provider = walletProviders.find(p => providerKey(p) === record.providerKey)
    if (!provider) {
      const timer = setTimeout(() => {
        if (!getTurnkeyActiveWallet()) setConnectedWalletRecord(null)
      }, 5000)
      return () => clearTimeout(timer)
    }

    restoreAttemptedRef.current = true
    if (provider.interfaceType !== WalletInterfaceType.Ethereum) {
      setConnectedWalletRecord(null)
      return
    }

    const eip1193 = provider.provider as EIP1193Provider
    void (async () => {
      try {
        const accounts = (await eip1193.request({ method: 'eth_accounts' })) as string[]
        const active = accounts?.[0]
        if (!active) {
          setConnectedWalletRecord(null)
          return
        }
        const address = getAddress(active)
        if (address.toLowerCase() !== record.address.toLowerCase()) {
          setConnectedWalletRecord({ providerKey: record.providerKey, address })
        }
        setConnectedTurnkeyWallet({ provider: eip1193, address })
      } catch {
        setConnectedWalletRecord(null)
      }
    })()
  }, [clientState, walletProviders])

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

    let pending = inFlightRef.current.get(key)
    if (!pending) {
      pending = connectWalletAccount(provider)
      inFlightRef.current.set(key, pending)
    }

    try {
      const account = await pending
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
      if (provider.interfaceType !== WalletInterfaceType.WalletConnect) {
        setConnectedWalletRecord({ providerKey: key, address: account.address as `0x${string}` })
      }
    } catch (err) {
      if (attemptRef.current !== attempt) return
      setError(extractErrorMessage(err))
    } finally {
      // Settled, so the wallet's queue is clear — drop it unless a newer call
      // for this key has already replaced the entry.
      if (inFlightRef.current.get(key) === pending) inFlightRef.current.delete(key)
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
    isLoadingOptions: clientState === undefined || clientState === ClientState.Loading,
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
    isLoadingOptions: false,
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
