import { useState } from 'react'
import { signTransferMessage } from '@oasisprotocol/flexvaults-sdk'
import type { WalletClient } from 'viem'
import { executeSwap } from '@/api/swap'
import type { QuoteResponse } from '@/api/swap'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import type { ActivityTokenInfo } from '@/contexts/ActivityProvider/context'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)
const ACCOUNTING_CONTRACT = import.meta.env.VITE_ACCOUNTING_CONTRACT_ADDRESS

type Params = {
  onSuccess?: () => void
}

export type SubmitSwapParams = {
  quote: QuoteResponse
  walletClient: WalletClient
  address: `0x${string}`
  fromToken: ActivityTokenInfo
  toToken: ActivityTokenInfo
  rateLabel: string
  feeFiat?: number
}

export const useSubmitSwap = ({ onSuccess }: Params = {}) => {
  const { addActivity, updateActivity } = useActivity()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async (params: SubmitSwapParams) => {
    const { quote, walletClient, address, fromToken, toToken, rateLabel, feeFiat } = params
    const id = crypto.randomUUID()
    addActivity({
      id,
      type: 'swap',
      status: 'in-progress',
      createdAt: Date.now(),
      fromToken,
      toToken,
      fromAmount: quote.from_amount,
      toAmount: quote.to_amount_estimate,
      rateLabel,
      feeFiat,
    })

    setLoading(true)
    setError(null)
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

      updateActivity(id, {
        swapId: swap.swap_id,
        txHash: swap.tx_hash ?? undefined,
      })
      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Swap failed'
      updateActivity(id, { status: 'failed', error: message })
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return { execute, loading, error }
}
