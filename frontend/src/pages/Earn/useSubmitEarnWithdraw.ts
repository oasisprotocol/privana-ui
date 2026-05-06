import { useState } from 'react'
import type { WalletClient } from 'viem'
import { getWithdrawNonce, withdrawEarn } from '@/api/earn'
import type { TokenInfo } from '@/api/swap'
import type { ActivityStatus } from '@/contexts/ActivityProvider/context'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import { extractErrorMessage } from '@/lib/errors'
import { signWithdrawConsent } from './signWithdrawConsent'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)
const EARN_MANAGER_CONTRACT = import.meta.env.VITE_EARN_MANAGER_CONTRACT_ADDRESS

// Backend returns a 400 with this prefix when the submitted nonce no longer
// matches EarnManager.withdrawNonces[user] — see vault_service.withdraw.
const isStaleNonceError = (err: unknown): boolean =>
  err instanceof Error && err.message.startsWith('Stale withdraw nonce')

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async (params: SubmitEarnWithdrawParams): Promise<boolean> => {
    const { amount, walletClient, address, token, poolId, protocol, apyLabel } = params
    if (token.token_decimals == null) {
      setError('Missing token decimals')
      return false
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
            user: address,
            poolId: poolId as `0x${string}`,
            amount: BigInt(amount),
            nonce: BigInt(nonce),
          },
        })

      const { nonce } = await getWithdrawNonce(address)
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
      })

      // Submit, retrying once if the server rejects with a stale-nonce 400 (e.g.
      // the on-chain nonce advanced between fetch and submit). Re-prompts the
      // wallet for a fresh signature against the current nonce.
      const submit = async () => {
        try {
          return await withdrawEarn({ pool_id: poolId, user_address: address, amount, nonce, signature })
        } catch (err) {
          if (!isStaleNonceError(err)) throw err
          const { nonce: freshNonce } = await getWithdrawNonce(address)
          const freshSignature = await signAt(freshNonce)
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
          updateActivity(id, {
            withdrawId: withdraw.withdraw_id,
            txHash: withdraw.tx_hash ?? undefined,
            status,
          })
          onSuccess?.()
        })
        .catch(err => {
          updateActivity(id, {
            status: 'failed',
            error: extractErrorMessage(err, 'Withdraw failed'),
          })
        })
        .finally(() => setLoading(false))

      return true
    } catch (err) {
      setError(extractErrorMessage(err, 'Withdraw failed'))
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
