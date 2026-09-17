import { useMemo } from 'react'
import { useConnectorClient } from 'wagmi'
import { walletActions, type WalletClient } from 'viem'

/**
 * Wallet client for signature-only flows, taken from the connector's ACTUAL
 * chain. `useWalletClient()` fails with ConnectorChainMismatchError when the
 * wallet sits on a chain outside the wagmi config (e.g. Arbitrum after
 * declining the connect-time switch), which would dead-end swap and earn now
 * that the Switch Network gates are gone. The salted EIP-712 domain makes
 * the signing chain irrelevant, so any chain the connector reports is fine.
 */
export const useSigningClient = (): WalletClient | undefined => {
  const { data: connectorClient } = useConnectorClient()
  return useMemo(
    () => (connectorClient ? (connectorClient.extend(walletActions) as unknown as WalletClient) : undefined),
    [connectorClient],
  )
}
