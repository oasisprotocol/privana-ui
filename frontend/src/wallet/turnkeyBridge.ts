import type { TurnkeySDKClientBase } from '@turnkey/react-wallet-kit'
import type { EIP1193Provider } from 'viem'

// The Turnkey wallet currently active in wagmi. The connector lives outside React
// (built in wagmi-config), so it can't read Turnkey's React context directly —
// TurnkeySync (inside TurnkeyProvider) publishes the active wallet here after
// login and clears it on logout.
//
// Two kinds:
//  - embedded: Turnkey-custodied. We build an EIP-1193 provider backed by
//    @turnkey/viem from the client + walletId on demand (see
//    turnkeyConnector's createEmbeddedProvider).
//  - connected: the user's own external wallet (MetaMask/Rabby), which Turnkey
//    surfaces as a standard viem EIP1193Provider we use directly — no patches,
//    key stays in the user's extension.
export type TurnkeyActiveWallet =
  | {
      kind: 'embedded'
      httpClient: TurnkeySDKClientBase
      organizationId: string
      walletId: string
      address: `0x${string}`
    }
  | {
      kind: 'connected'
      provider: EIP1193Provider
      address: `0x${string}`
    }

let current: TurnkeyActiveWallet | null = null

export function setTurnkeyActiveWallet(wallet: TurnkeyActiveWallet | null): void {
  current = wallet
}

export function getTurnkeyActiveWallet(): TurnkeyActiveWallet | null {
  return current
}
