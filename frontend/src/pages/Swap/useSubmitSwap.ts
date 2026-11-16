import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { signTransferMessage } from '@oasisprotocol/privana-sdk'
import type { WalletClient } from 'viem'
import { executeSwap } from '@/api/swap'
import type { QuoteResponse, TokenInfo } from '@/api/swap'
import { operationsKeys } from '@/api/operations'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import type { ActivityStatus } from '@/contexts/ActivityProvider/context'
import { extractErrorMessage, isDefinitiveRejection, isNonceRefusal, nonceRefusalMessage } from '@/lib/errors'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)
const ACCOUNTING_CONTRACT = import.meta.env.VITE_ACCOUNTING_CONTRACT_ADDRESS

type Params = {
  onSuccess?: () => void
  // The backend refused to queue it (409): the optimistic entry is dropped
  // and the caller can return to the confirm step.
  onRefused?: () => void
}

export type SubmitSwapParams = {
  quote: QuoteResponse
  walletClient: WalletClient
  address: `0x${string}`
  fromToken: TokenInfo
  toToken: TokenInfo
  feeFiat?: number
}

export type SubmittedSwap = { operationId?: string }

export const useSubmitSwap = ({ onSuccess, onRefused }: Params = {}) => {
  const { addActivity, updateActivity, removeActivity } = useActivity()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const execute = async (params: SubmitSwapParams): Promise<SubmittedSwap | null> => {
    const { quote, walletClient, address, fromToken, toToken, feeFiat } = params
    if (fromToken.token_decimals == null || toToken.token_decimals == null) {
      setError('Missing token decimals')
      return null
    }
    setLoading(true)
    setError(null)
    let id: string | undefined
    try {
      const signature = await signTransferMessage({
        walletClient,
        chainId: CHAIN_ID,
        verifyingContract: ACCOUNTING_CONTRACT,
        message: {
          toAddress: quote.liquidity_provider as `0x${string}`,
          tokenId: quote.from_token_id as `0x${string}`,
          amount: BigInt(quote.from_amount),
          nonce: BigInt(quote.transfer_nonce),
        },
      })

      id = crypto.randomUUID()
      addActivity({
        id,
        type: 'swap',
        status: 'in-progress',
        createdAt: Date.now(),
        quoteId: quote.quote_id,
        fromToken: {
          id: fromToken.token_id,
          symbol: fromToken.token_symbol ?? fromToken.token_type_name,
          decimals: fromToken.token_decimals,
        },
        toToken: {
          id: toToken.token_id,
          symbol: toToken.token_symbol ?? toToken.token_type_name,
          decimals: toToken.token_decimals,
        },
        fromAmount: quote.from_amount,
        toAmount: quote.to_amount_estimate,
        feeFiat,
      })

      const swap = await executeSwap({
        quote_id: quote.quote_id,
        user_address: address,
        input_nonce: quote.transfer_nonce,
        input_signature: signature,
      })
      const status: ActivityStatus =
        swap.status === 'completed' || swap.status === 'failed' ? swap.status : 'in-progress'
      updateActivity(id, {
        swapId: swap.swap_id,
        txHash: swap.tx_hash ?? undefined,
        status,
      })
      void queryClient.invalidateQueries({ queryKey: operationsKeys.all })
      onSuccess?.()
      return { operationId: swap.swap_id }
    } catch (err) {
      if (id === undefined) {
        setError(extractErrorMessage(err, 'Swap failed'))
        return null
      }
      if (isNonceRefusal(err)) {
        removeActivity(id)
        setError(nonceRefusalMessage(err))
        onRefused?.()
        return null
      }
      if (isDefinitiveRejection(err)) {
        removeActivity(id)
        setError(extractErrorMessage(err, 'Swap failed'))
        return null
      }
      void queryClient.invalidateQueries({ queryKey: operationsKeys.all })
      return {}
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setLoading(false)
    setError(null)
  }

  return { execute, loading, error, reset }
}
