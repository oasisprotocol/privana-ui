// Temporary workaround until backend is updated
// https://github.com/oasisprotocol/privana-services/pull/20#discussion_r3232291523
import { useCallback } from 'react'
import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { createSiweMessage } from 'viem/siwe'
import { useAccount, useWalletClient } from 'wagmi'

const SIWE_STATEMENT = 'Sign in to Privana to access private account data.'
const SIWE_VALIDITY_MS = 24 * 60 * 60 * 1000

export interface UseSwapSiweAuthResult {
  isReady: boolean
  getToken: () => Promise<string>
  clearToken: () => void
}

export function useSwapSiweAuth(): UseSwapSiweAuthResult {
  const { client, networkConfig } = usePrivanaContext()
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()
  const isReady = !!walletClient && !!address

  const getToken = useCallback(async (): Promise<string> => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected')
    }
    const cached = client.getPrivateReadToken()
    if (cached) return cached

    const [{ domain }, nonceResponse] = await Promise.all([
      client.getSiweDomain(),
      client.getSiweNonce(address),
    ])

    const issuedAt = new Date()
    const expirationTime = new Date(issuedAt.getTime() + SIWE_VALIDITY_MS)
    const uri = typeof window !== 'undefined' ? window.location.origin : networkConfig.apiUrl

    const message = createSiweMessage({
      address,
      chainId: walletClient.chain?.id ?? networkConfig.chainId,
      domain,
      expirationTime,
      issuedAt,
      nonce: nonceResponse.nonce,
      statement: SIWE_STATEMENT,
      uri,
      version: '1',
    })

    const signature = await walletClient.signMessage({
      account: walletClient.account ?? address,
      message,
    })

    const login = await client.loginWithSiwe({
      siwe_message: message,
      signature,
    })

    client.setPrivateReadToken(login.siwe_token)
    return login.siwe_token
  }, [address, client, networkConfig.apiUrl, networkConfig.chainId, walletClient])

  const clearToken = useCallback(() => {
    client.clearPrivateReadToken()
  }, [client])

  return { isReady, getToken, clearToken }
}
