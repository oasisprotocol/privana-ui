import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { earnKeys, useEarnBalance, useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { StepsNav } from '@/components/StepsNav'
import { extractErrorMessage } from '@/lib/errors'
import { activityPath } from '@/paths'
import { formatApyBps, PROTOCOL_LABELS } from './labels'
import { WithdrawConfigureStep } from './WithdrawConfigureStep'
import { WithdrawReviewStep } from './WithdrawReviewStep'
import { useSubmitEarnWithdraw } from './useSubmitEarnWithdraw'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)

const steps = ['1. Configure', '2. Review']

export const EarnWithdraw = () => {
  const { poolId } = useParams<{ poolId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain, error: switchChainError } = useSwitchChain()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState(0)

  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()
  const { data: balanceData, isLoading: balanceLoading } = useEarnBalance(address)
  const { data: tokensData, isLoading: tokensLoading } = useTokens()

  const pools = poolsData?.pools ?? []
  const positions = balanceData?.positions ?? []
  const pool = pools.find(p => p.pool_id === poolId)
  const position = positions.find(p => p.pool_id === poolId)
  const token = pool ? tokensData?.tokens.find(t => t.token_id === pool.token_id) : undefined
  const decimals = token?.token_decimals
  const isLoading = poolsLoading || balanceLoading || tokensLoading

  const protocol = pool ? (PROTOCOL_LABELS[pool.strategy] ?? pool.strategy) : ''
  const apyLabel = pool ? `${formatApyBps(pool.apy_bps)} APY` : undefined

  const amountBaseUnits = useMemo(() => {
    if (!amount || decimals == null) return ''
    try {
      return parseUnits(amount, decimals).toString()
    } catch {
      return ''
    }
  }, [amount, decimals])

  const {
    execute: runWithdraw,
    loading: withdrawLoading,
    error: withdrawError,
    reset: resetWithdraw,
  } = useSubmitEarnWithdraw({
    onSuccess: () => {
      if (address) queryClient.removeQueries({ queryKey: earnKeys.balance(address) })
      queryClient.removeQueries({ queryKey: ['accounting-balance'] })
    },
  })

  const canConfirm = !!address && !!walletClient && !!token && !!position && !!poolId && !!amountBaseUnits

  const handleConfirm = async () => {
    if (!canConfirm || !address || !walletClient || !token || !poolId) return
    const ok = await runWithdraw({
      amount: amountBaseUnits,
      walletClient,
      address,
      token,
      poolId,
      protocol,
      apyLabel,
    })
    if (ok) navigate(activityPath())
  }

  const handleBack = () => {
    resetWithdraw()
    setStep(0)
  }

  const reviewError = withdrawError ?? (switchChainError ? extractErrorMessage(switchChainError) : null)

  if (!poolId) return null

  return (
    <div>
      <StepsNav steps={steps} activeIndex={step} ariaLabel="Withdraw progress" />

      {step === 0 && (
        <WithdrawConfigureStep
          pool={pool}
          position={position}
          token={token}
          isLoading={isLoading}
          amount={amount}
          onAmountChange={setAmount}
          onReview={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <WithdrawReviewStep
          pool={pool}
          position={position}
          token={token}
          amount={amount}
          isLoading={isLoading}
          isCorrectChain={chainId === CHAIN_ID}
          canConfirm={canConfirm}
          onSwitchChain={() => switchChain({ chainId: CHAIN_ID })}
          onBack={handleBack}
          onConfirm={handleConfirm}
          loading={withdrawLoading}
          error={reviewError}
        />
      )}
    </div>
  )
}
