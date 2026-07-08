import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi'
import { parseUnits } from 'viem'
import { useEarnBalance, useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { useResetBalanceCaches } from '@/hooks/use-reset-balance-caches'
import { extractErrorMessage } from '@/lib/errors'
import { activityPath, earnPath } from '@/paths'
import { cn } from '@/lib/utils'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import { PROTOCOL_LABELS } from './labels'
import { formatApyBps } from '@/lib/apy'
import { WithdrawConfigureStep } from './WithdrawConfigureStep'
import { WithdrawReviewStep } from './WithdrawReviewStep'
import { EarnWithdrawResult } from './EarnWithdrawResult'
import { useSubmitEarnWithdraw } from './useSubmitEarnWithdraw'
import type { AppChainId } from '@/wagmi-config'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId

// Desktop-only card surface (flat on mobile), matching the swap flow.
const DESKTOP_CARD = 'md:rounded-3xl md:bg-white md:p-6 md:dark:bg-card md:shadow-[var(--card-shadow)]'

export const EarnWithdraw = () => {
  const { poolId } = useParams<{ poolId: string }>()
  const navigate = useNavigate()
  const resetBalanceCaches = useResetBalanceCaches()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain, error: switchChainError } = useSwitchChain()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState(0)
  const [withdrawActivityId, setWithdrawActivityId] = useState<string | null>(null)
  const { activities } = useActivity()

  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()
  const { data: balanceData, isLoading: balanceLoading } = useEarnBalance()
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
    onSuccess: resetBalanceCaches,
  })

  const canConfirm = !!address && !!walletClient && !!token && !!position && !!poolId && !!amountBaseUnits

  const withdrawActivity = useMemo(() => {
    if (!withdrawActivityId) return undefined
    const found = activities.find(a => a.id === withdrawActivityId)
    return found?.type === 'earn' ? found : undefined
  }, [activities, withdrawActivityId])

  const handleConfirm = async () => {
    if (!canConfirm || !address || !walletClient || !token || !poolId) return
    const id = await runWithdraw({
      amount: amountBaseUnits,
      walletClient,
      address,
      token,
      poolId,
      protocol,
      apyLabel,
    })
    if (id) {
      setWithdrawActivityId(id)
      setStep(2)
    }
  }

  const handleBack = () => {
    resetWithdraw()
    setStep(0)
  }

  const handleDone = () => {
    resetWithdraw()
    setWithdrawActivityId(null)
    navigate(earnPath())
  }

  const reviewError = withdrawError ?? (switchChainError ? extractErrorMessage(switchChainError) : null)

  if (!poolId) return null

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
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

      {step === 2 && withdrawActivity && (
        <EarnWithdrawResult
          activity={withdrawActivity}
          onDone={handleDone}
          onViewActivity={() => navigate(activityPath())}
        />
      )}
    </div>
  )
}
