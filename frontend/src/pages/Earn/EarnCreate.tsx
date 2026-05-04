import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { earnKeys, useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { StepsNav } from '@/components/StepsNav'
import { activityPath, earnCreatePath } from '@/paths'
import { ConfigureStep } from './ConfigureStep'
import { formatApyBps, PROTOCOL_LABELS } from './labels'
import { ReviewStep } from './ReviewStep'
import { useEarnDepositQuote } from './useEarnDepositQuote'
import { useSubmitEarnDeposit } from './useSubmitEarnDeposit'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)

const steps = ['1. Configure', '2. Review']

export const EarnCreate = () => {
  const { poolId } = useParams<{ poolId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain } = useSwitchChain()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState(0)

  const handlePoolIdChange = (id: string | undefined) => {
    navigate(earnCreatePath(id), { replace: true })
  }

  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading } = useTokens()

  const pools = poolsData?.pools ?? []
  const pool = pools.find(p => p.pool_id === poolId)
  const token = pool ? tokensData?.tokens.find(t => t.token_id === pool.token_id) : undefined
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
    expired: quoteExpired,
  } = useEarnDepositQuote({
    poolId: poolId ?? '',
    amount: amountBaseUnits,
    userAddress: address,
    enabled: onReview && !!address && !!amountBaseUnits && !!pool,
    pauseRefetch: true,
  })

  const {
    execute: runDeposit,
    loading: depositLoading,
    error: depositError,
    reset: resetDeposit,
  } = useSubmitEarnDeposit({
    onSuccess: () => {
      if (address) queryClient.removeQueries({ queryKey: earnKeys.balance(address) })
    },
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
    setStep(0)
  }

  return (
    <div>
      <StepsNav steps={steps} activeIndex={step} ariaLabel="Earn progress" />

      {step === 0 && (
        <ConfigureStep
          poolId={poolId}
          amount={amount}
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
          isLoading={poolsLoading || tokensLoading}
          quoteLoading={quoteLoading}
          quoteExpired={quoteExpired}
          isCorrectChain={chainId === CHAIN_ID}
          onSwitchChain={() => switchChain({ chainId: CHAIN_ID })}
          onBack={handleBack}
          onConfirm={handleConfirm}
          loading={depositLoading}
          error={depositError}
        />
      )}
    </div>
  )
}
