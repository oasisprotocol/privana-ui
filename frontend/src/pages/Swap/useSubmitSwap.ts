import { useState } from 'react'
import { signTransferMessage } from '@oasisprotocol/flexvaults-sdk'
import type { WalletClient } from 'viem'
import { executeSwap } from '@/api/swap'
import type { QuoteResponse, TokenInfo } from '@/api/swap'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import type { SwapActivityStatus } from '@/contexts/ActivityProvider/context'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)
const ACCOUNTING_CONTRACT = import.meta.env.VITE_ACCOUNTING_CONTRACT_ADDRESS

type Params = {
  onSuccess?: () => void
}

export type SubmitSwapParams = {
  quote: QuoteResponse
  walletClient: WalletClient
  address: `0x${string}`
  fromToken: TokenInfo
  toToken: TokenInfo
  rateLabel: string
  feeFiat?: number
}

export const useSubmitSwap = ({ onSuccess }: Params = {}) => {
  const { addActivity, updateActivity } = useActivity()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async (params: SubmitSwapParams): Promise<boolean> => {
    const { quote, walletClient, address, fromToken, toToken, rateLabel, feeFiat } = params
    if (fromToken.token_decimals == null || toToken.token_decimals == null) {
      setError('Missing token decimals')
      return false
    }
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

      const id = crypto.randomUUID()
      addActivity({
        id,
        type: 'swap',
        status: 'in-progress',
        createdAt: Date.now(),
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
        rateLabel,
        feeFiat,
      })
      setLoading(false)

      // Fire-and-forget: backend settlement may take seconds. Caller navigates
      // away once this returns true; the result flows back to the activity
      // entry via updateActivity.
      executeSwap({
        quote_id: quote.quote_id,
        user_address: address,
        input_nonce: quote.transfer_nonce,
        input_signature: signature,
      })
        .then(swap => {
          const status: SwapActivityStatus =
            swap.status === 'completed' || swap.status === 'failed' ? swap.status : 'in-progress'
          updateActivity(id, {
            swapId: swap.swap_id,
            txHash: swap.tx_hash ?? undefined,
            status,
          })
          onSuccess?.()
        })
        .catch(err => {
          updateActivity(id, {
            status: 'failed',
            error: err instanceof Error ? err.message : 'Swap failed',
          })
        })

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed')
      setLoading(false)
      return false
    }
  }

  return { execute, loading, error }
}
