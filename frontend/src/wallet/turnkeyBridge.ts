import type { TurnkeySDKClientBase } from '@turnkey/core'

// Runtime signer context for the Turnkey embedded wallet. The wagmi connector
// lives outside React (it's built in wagmi-config), so it can't read Turnkey's
// React context directly. TurnkeySync (mounted inside TurnkeyProvider) writes
// the live session here after login and clears it on logout; the connector
// reads it lazily when building its EIP-1193 provider.
export type TurnkeySignerContext = {
  httpClient: TurnkeySDKClientBase
  organizationId: string
  walletId: string
  address: `0x${string}`
}

let current: TurnkeySignerContext | null = null

export function setTurnkeySignerContext(ctx: TurnkeySignerContext | null): void {
  current = ctx
}

export function getTurnkeySignerContext(): TurnkeySignerContext | null {
  return current
}
