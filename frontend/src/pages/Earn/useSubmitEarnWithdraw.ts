import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { WalletClient } from 'viem'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { ApiError, getWithdrawNonce, withdrawEarn } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import { operationsKeys } from '@/api/operations'
import { earnKeys } from '@/api/earn'
import type { ActivityStatus } from '@/contexts/ActivityProvider/context'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import { extractErrorMessage, isDefinitiveRejection } from '@/lib/errors'
import { signWithdrawConsent } from './signWithdrawConsent'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)
const EARN_MANAGER_CONTRACT = import.meta.env.VITE_EARN_MANAGER_CONTRACT_ADDRESS

type Params = {
  onSuccess?: () => void
}

export type SubmitEarnWithdrawParams = {
  amount: string
  walletClient: WalletClient
  address: `0x${string}`
  token: TokenInfo
  poolId: string
  protocol: string
  apyLabel?: string
}

export const useSubmitEarnWithdraw = ({ onSuccess }: Params = {}) => {
  const { addActivity, updateActivity } = useActivity()
  const { accessToken } = useSiweAuth()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resolves to the created activity's id (so the caller can track its live
  // status for the removing/result screens) or null if signing failed before an
  // activity was created.
  const execute = async (params: SubmitEarnWithdrawParams): Promise<string | null> => {
    const { amount, walletClient, address, token, poolId, protocol, apyLabel } = params
    if (token.token_decimals == null) {
      setError('Missing token decimals')
      return null
    }
    const jwt = accessToken
    if (!jwt) {
      setError('Not signed in')
      return null
    }
    setLoading(true)
    setError(null)
    try {
      const signAt = (nonce: number) =>
        signWithdrawConsent({
          walletClient,
          chainId: CHAIN_ID,
          earnManagerAddress: EARN_MANAGER_CONTRACT,
          message: {
            poolId: poolId as `0x${string}`,
            amount: BigInt(amount),
            nonce: BigInt(nonce),
          },
        })

      const { nonce } = await getWithdrawNonce(jwt)
      const signature = await signAt(nonce)

      const id = crypto.randomUUID()
      addActivity({
        id,
        type: 'earn',
        direction: 'withdraw',
        status: 'in-progress',
        createdAt: Date.now(),
        token: {
          id: token.token_id,
          symbol: token.token_symbol ?? token.token_type_name,
          decimals: token.token_decimals,
        },
        amount,
        poolId,
        protocol,
        apyLabel,
        nonce: String(nonce),
      })

      // Submit, retrying once if the on-chain nonce advanced between fetch and
      // submit. On any 400 we refetch the nonce and only retry (re-prompting
      // the wallet for a fresh signature) if it actually moved — that's what
      // makes the original signature stale. Other 400s (e.g. insufficient
      // shares) leave the nonce unchanged and surface to the caller as-is.
      const submit = async () => {
        try {
          return await withdrawEarn({ pool_id: poolId, user_address: address, amount, nonce, signature })
        } catch (err) {
          if (!(err instanceof ApiError) || err.status !== 400) throw err
          const { nonce: freshNonce } = await getWithdrawNonce(jwt)
          if (freshNonce === nonce) throw err
          // The first request was refused for good; a rejected re-sign must
          // not leave the entry in progress waiting for a submit that never
          // happened, and the user rejecting is what the failure should say.
          const freshSignature = await signAt(freshNonce).catch(() => {
            throw new ApiError(err.status, 'Signature request rejected')
          })
          return withdrawEarn({
            pool_id: poolId,
            user_address: address,
            amount,
            nonce: freshNonce,
            signature: freshSignature,
          })
        }
      }

      // Fire-and-forget: backend withdraw may take seconds. Caller navigates away
      // once this returns true; the result flows back to the activity entry via
      // updateActivity. `loading` stays true until the POST resolves so the
      // Confirm button remains disabled during the in-flight window.
      submit()
        .then(withdraw => {
          const status: ActivityStatus =
            withdraw.status === 'completed' || withdraw.status === 'failed' ? withdraw.status : 'in-progress'
          // withdraw_id is the server's operation id — see useSubmitEarnDeposit.
          updateActivity(id, {
            withdrawId: withdraw.withdraw_id,
            txHash: withdraw.tx_hash ?? undefined,
            status,
            error: withdraw.error ?? undefined,
          })
          void queryClient.invalidateQueries({ queryKey: operationsKeys.all })
          // The position and the pool totals both moved, and both are cached
          // with a 30s staleTime. Without this the screen keeps showing the
          // pre-withdraw figures long after the withdraw settled.
          void queryClient.invalidateQueries({ queryKey: earnKeys.all })
          onSuccess?.()
        })
        .catch(err => {
          // Only a 4xx proves the backend refused it. Earn runs the strategy
          // leg inline behind a serialized queue, so a slow pool can hold the
          // request past the gateway's timeout while the withdraw is still
          // settling — a Midas exit waits on Ethereum finality alone. Calling
          // that failed fabricates a failure for an operation that usually
          // completes, and sends people back to retry with a nonce that has
          // already been consumed. Leave it in-progress and let the operations
          // feed reconcile it.
          if (isDefinitiveRejection(err)) {
            updateActivity(id, {
              status: 'failed',
              error: extractErrorMessage(err, 'Withdraw failed'),
            })
            return
          }
          void queryClient.invalidateQueries({ queryKey: operationsKeys.all })
        })
        .finally(() => setLoading(false))

      return id
    } catch (err) {
      setError(extractErrorMessage(err, 'Withdraw failed'))
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
