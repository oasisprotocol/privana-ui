import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi'
import { parseUnits } from 'viem'
import { useEarnPools } from '@/api/earn'
import { StepsNav } from '@/components/StepsNav'
import { useResetBalanceCaches } from '@/hooks/use-reset-balance-caches'
import { extractErrorMessage } from '@/lib/errors'
import { activityPath, earnCreatePath } from '@/paths'
import { ConfigureStep } from './ConfigureStep'
import { formatApyBps, PROTOCOL_LABELS } from './labels'
import { ReviewStep } from './ReviewStep'
import { useEarnDepositQuote } from './useEarnDepositQuote'
import { useEarnToken } from './useEarnToken'
import { useSubmitEarnDeposit } from './useSubmitEarnDeposit'
import type { AppChainId } from '@/wagmi-config'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId

const steps = ['1. Configure', '2. Review']

export const EarnCreate = () => {
  const { poolId } = useParams<{ poolId?: string }>()
  const navigate = useNavigate()
  const resetBalanceCaches = useResetBalanceCaches()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain, error: switchChainError } = useSwitchChain()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState(0)
  // At mount: if poolId came in via URL (e.g., "Add to active strategy"),
  // the user shouldn't be able to switch strategies. Picking a pool on /create
  // afterwards still navigates to /create/:poolId but mustn't flip this back to locked.
  const [strategyLocked] = useState(() => !!poolId)

  const handlePoolIdChange = (id: string | undefined) => {
    navigate(earnCreatePath(id), { replace: true })
  }

  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()

  const pools = poolsData?.pools ?? []
  const pool = pools.find(p => p.pool_id === poolId)
  const token = useEarnToken(pool?.token_id)
  const decimals = token?.token_decimals

  const amountBaseUnits = useMemo(() => {
    if (!amount || decimals == null) return ''
    try {
      return parseUnits(amount, decimals).toString()
    } catch {
      return ''
    }
  }, [amount, decimals])

  const onReview = step === 1
  const {
    data: quote,
    loading: quoteLoading,
    error: quoteError,
    reset: resetQuote,
  } = useEarnDepositQuote({
    poolId: poolId ?? '',
    amount: amountBaseUnits,
    userAddress: address,
    enabled: onReview && !!address && !!amountBaseUnits && !!pool,
  })

  const {
    execute: runDeposit,
    loading: depositLoading,
    error: depositError,
    reset: resetDeposit,
  } = useSubmitEarnDeposit({
    onSuccess: resetBalanceCaches,
  })

  const protocol = pool ? (PROTOCOL_LABELS[pool.strategy] ?? pool.strategy) : ''
  const apyLabel = pool ? `${formatApyBps(pool.apy_bps)} APY` : undefined

  const handleConfirm = async () => {
    if (!quote || !walletClient || !address || !pool || !token || !poolId) return
    const ok = await runDeposit({ quote, walletClient, address, token, poolId, protocol, apyLabel })
    if (ok) navigate(activityPath())
  }

  const handleBack = () => {
    resetDeposit()
    resetQuote()
    setStep(0)
  }

  const reviewError = depositError ?? (switchChainError ? extractErrorMessage(switchChainError) : null)

  return (
    <div>
      <StepsNav steps={steps} activeIndex={step} ariaLabel="Earn progress" />

      {step === 0 && (
        <ConfigureStep
          poolId={poolId}
          amount={amount}
          strategyLocked={strategyLocked}
          onPoolIdChange={handlePoolIdChange}
          onAmountChange={setAmount}
          onReview={() => setStep(1)}
        />
      )}

      {step === 1 && poolId && (
        <ReviewStep
          pool={pool}
          token={token}
          amount={amount}
          quote={quote ?? undefined}
          isLoading={poolsLoading}
          quoteLoading={quoteLoading}
          quoteError={quoteError}
          expiresAt={quote?.expires_at}
          isCorrectChain={chainId === CHAIN_ID}
          onSwitchChain={() => switchChain({ chainId: CHAIN_ID })}
          onBack={handleBack}
          onConfirm={handleConfirm}
          loading={depositLoading}
          error={reviewError}
        />
      )}
    </div>
  )
}
