import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { WalletClient } from 'viem'
import { signTransferMessage } from '@oasisprotocol/privana-sdk'
import { depositEarn, type DepositQuoteResponse } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { operationsKeys } from '@/api/operations'
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
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resolves to the created activity's id (so the caller can track its live
  // status for the moving/result screens) or null if signing failed before an
  // activity was created.
  const execute = async (params: SubmitEarnDepositParams): Promise<string | null> => {
    const { quote, walletClient, address, token, poolId, protocol, apyLabel } = params
    if (token.token_decimals == null) {
      setError('Missing token decimals')
      return null
    }
    setLoading(true)
    setError(null)
    try {
      const signature = await signTransferMessage({
        walletClient,
        chainId: CHAIN_ID,
        verifyingContract: ACCOUNTING_CONTRACT,
        message: {
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
          // deposit_id is the server's operation id. Recording it is what lets the
          // merged activity list see this entry and the server's unsettled copy as
          // one operation — without it a failed deposit renders twice.
          updateActivity(id, {
            depositId: deposit.deposit_id,
            txHash: deposit.tx_hash ?? undefined,
            status,
            error: deposit.error ?? undefined,
          })
          void queryClient.invalidateQueries({ queryKey: operationsKeys.all })
          onSuccess?.()
        })
        .catch(err => {
          // Only a request that produced no response at all reaches here, so there
          // is no server-side operation for this entry to be matched against.
          updateActivity(id, {
            status: 'failed',
            error: extractErrorMessage(err, 'Deposit failed'),
          })
        })
        .finally(() => setLoading(false))

      return id
    } catch (err) {
      setError(extractErrorMessage(err, 'Deposit failed'))
      setLoading(false)
      return null
    }
  }

  const reset = () => {
    setLoading(false)
    setError(null)
  }

  return { execute, loading, error, reset }
}
