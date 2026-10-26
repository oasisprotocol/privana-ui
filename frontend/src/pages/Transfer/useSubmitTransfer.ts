import { useQueryClient } from '@tanstack/react-query'
import {
  AccountingApiError,
  NetworkError,
  signTransferMessage,
  usePrivanaContext,
} from '@oasisprotocol/privana-sdk'
import { useConnection } from 'wagmi'
import { useSigningClient } from '@/hooks/use-signing-client'

// Accounting answers 409 when it submitted the transfer but saw no outcome; a timeout or a 5xx
// leaves it unknown too. Either way the transfer may still have gone through.
const isUnknownOutcome = (err: unknown) =>
  err instanceof NetworkError ||
  (err instanceof AccountingApiError && (err.statusCode === 409 || err.statusCode >= 500))

type TransferParams = {
  toAddress: `0x${string}`
  tokenId: `0x${string}`
  amount: bigint
}

export const useSubmitTransfer = () => {
  const { address } = useConnection()
  const walletClient = useSigningClient()
  const { client, networkConfig } = usePrivanaContext()
  const queryClient = useQueryClient()

  // Only the submission can leave the outcome unknown: a failed nonce read or signature sent nothing.
  return async ({ toAddress, tokenId, amount }: TransferParams): Promise<'sent' | 'unknown'> => {
    if (!address || !walletClient) throw new Error('Wallet not connected')
    const { nonce } = await client.getTransferNonce(address)
    const signature = await signTransferMessage({
      walletClient,
      chainId: networkConfig.chainId,
      verifyingContract: networkConfig.accountingContract,
      message: { toAddress, tokenId, amount, nonce: BigInt(nonce) },
    })
    let status: 'sent' | 'unknown' = 'sent'
    try {
      await client.transferFunds({
        to_address: toAddress,
        token_id: tokenId,
        amount: amount.toString(),
        nonce,
        signature,
      })
    } catch (err) {
      if (!isUnknownOutcome(err)) throw err
      status = 'unknown'
    }
    void queryClient.invalidateQueries({ queryKey: ['accounting-history'] })
    return status
  }
}
