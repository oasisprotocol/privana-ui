import { useState } from 'react'
import { signTransferMessage } from '@oasisprotocol/flexvaults-sdk'
import type { WalletClient } from 'viem'
import { executeSwap } from '@/api/swap'
import type { QuoteResponse, SwapResponse } from '@/api/swap'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)
const ACCOUNTING_CONTRACT = import.meta.env.VITE_ACCOUNTING_CONTRACT_ADDRESS

type Params = {
  onSuccess?: () => void
}

export const useExecuteSwap = ({ onSuccess }: Params = {}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SwapResponse | null>(null)

  const execute = async (quote: QuoteResponse, walletClient: WalletClient, address: `0x${string}`) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const signature = await signTransferMessage({
        walletClient,
        chainId: CHAIN_ID,
        verifyingContract: ACCOUNTING_CONTRACT,
        message: {
          userAddress: address,
          toAddress: quote.liquidity_provider as `0x${string}`,
          tokenId: quote.from_token_id as `0x${string}`,
          amount: BigInt(quote.from_amount),
          nonce: BigInt(quote.transfer_nonce),
        },
      })

      const swap = await executeSwap({
        quote_id: quote.quote_id,
        user_address: address,
        input_nonce: quote.transfer_nonce,
        input_signature: signature,
      })

      setResult(swap)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed')
    } finally {
      setLoading(false)
    }
  }

  return { execute, loading, error, result }
}
