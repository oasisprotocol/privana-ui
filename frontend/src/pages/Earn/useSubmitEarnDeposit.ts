import { useState } from 'react'
import type { WalletClient } from 'viem'
import { signTransferMessage } from '@oasisprotocol/flexvaults-sdk'
import { depositEarn, type DepositQuoteResponse } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import type { ActivityStatus } from '@/contexts/ActivityProvider/context'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import { extractErrorMessage } from '@/lib/errors'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)
const ACCOUNTING_CONTRACT = import.meta.env.VITE_ACCOUNTING_CONTRACT_ADDRESS

type Params = {
  onSuccess?: () => void
}

export type SubmitEarnDepositParams = {
  quote: DepositQuoteResponse
  walletClient: WalletClient
  address: `0x${string}`
  token: TokenInfo
  poolId: string
  protocol: string
  apyLabel?: string
}

export const useSubmitEarnDeposit = ({ onSuccess }: Params = {}) => {
  const { addActivity, updateActivity } = useActivity()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async (params: SubmitEarnDepositParams): Promise<boolean> => {
    const { quote, walletClient, address, token, poolId, protocol, apyLabel } = params
    if (token.token_decimals == null) {
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
          toAddress: quote.pool_address as `0x${string}`,
          tokenId: quote.token_id as `0x${string}`,
          amount: BigInt(quote.amount),
          nonce: BigInt(quote.transfer_nonce),
        },
      })

      const id = crypto.randomUUID()
      addActivity({
        id,
        type: 'earn',
        direction: 'deposit',
        status: 'in-progress',
        createdAt: Date.now(),
        token: {
          id: token.token_id,
          symbol: token.token_symbol ?? token.token_type_name,
          decimals: token.token_decimals,
        },
        amount: quote.amount,
        poolId,
        protocol,
        apyLabel,
      })

      // Fire-and-forget: backend deposit may take seconds. Caller navigates away
      // once this returns true; the result flows back to the activity entry via
      // updateActivity. `loading` stays true until the POST resolves so the
      // Confirm button remains disabled during the in-flight window.
      depositEarn({
        pool_id: poolId,
        user_address: address,
        amount: quote.amount,
        nonce: quote.transfer_nonce,
        signature,
      })
        .then(deposit => {
          const status: ActivityStatus =
            deposit.status === 'completed' || deposit.status === 'failed' ? deposit.status : 'in-progress'
          updateActivity(id, {
            depositId: deposit.deposit_id,
            txHash: deposit.tx_hash ?? undefined,
            status,
          })
          onSuccess?.()
        })
        .catch(err => {
          updateActivity(id, {
            status: 'failed',
            error: extractErrorMessage(err, 'Deposit failed'),
          })
        })
        .finally(() => setLoading(false))

      return true
    } catch (err) {
      setError(extractErrorMessage(err, 'Deposit failed'))
      setLoading(false)
      return false
    }
  }

  const reset = () => {
    setLoading(false)
    setError(null)
  }

  return { execute, loading, error, reset }
}
