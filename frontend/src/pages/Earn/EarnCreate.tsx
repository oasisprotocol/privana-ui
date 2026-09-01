import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useConnection, useSwitchChain, useWalletClient } from 'wagmi'
import { parseUnits } from 'viem'
import { useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { useResetBalanceCaches } from '@/hooks/use-reset-balance-caches'
import { extractErrorMessage } from '@/lib/errors'
import { activityPath, earnCreatePath, earnPath } from '@/paths'
import { cn } from '@/lib/utils'
import { DESKTOP_CARD } from '@/lib/surface'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import { ConfigureStep } from './ConfigureStep'
import { getProtocolLabel } from '@/config/protocols'
import { formatApyBps } from '@/lib/apy'
import { ReviewStep } from './ReviewStep'
import { EarnDepositResult } from './EarnDepositResult'
import { useEarnDepositQuote } from './useEarnDepositQuote'
import { useSubmitEarnDeposit } from './useSubmitEarnDeposit'
import type { AppChainId } from '@/wagmi-config'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId

export const EarnCreate = () => {
  const { poolId } = useParams<{ poolId?: string }>()
  const navigate = useNavigate()
  const resetBalanceCaches = useResetBalanceCaches()
  const { address, chainId } = useConnection()
  const { data: walletClient } = useWalletClient()
  const { mutate: switchChain, error: switchChainError } = useSwitchChain()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState(0)
  const [depositActivityId, setDepositActivityId] = useState<string | null>(null)
  const { activities } = useActivity()
  // At mount: if poolId came in via URL (e.g., "Add to active strategy"),
  // the user shouldn't be able to switch strategies. Picking a pool on /create
  // afterwards still navigates to /create/:poolId but mustn't flip this back to locked.
  const [strategyLocked] = useState(() => !!poolId)

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

  const protocol = pool ? getProtocolLabel(pool.strategy) : ''
  const apyLabel = pool ? `${formatApyBps(pool.apy_bps)} APY` : undefined

  const depositActivity = useMemo(() => {
    if (!depositActivityId) return undefined
    const found = activities.find(a => a.id === depositActivityId)
    return found?.type === 'earn' ? found : undefined
  }, [activities, depositActivityId])

  const handleConfirm = async () => {
    if (!quote || !walletClient || !address || !pool || !token || !poolId) return
    const id = await runDeposit({ quote, walletClient, address, token, poolId, protocol, apyLabel })
    if (id) {
      setDepositActivityId(id)
      setStep(2)
    }
  }

  const handleBack = () => {
    resetDeposit()
    resetQuote()
    setStep(0)
  }

  const handleDone = () => {
    resetDeposit()
    resetQuote()
    setDepositActivityId(null)
    navigate(earnPath())
  }

  const reviewError = depositError ?? (switchChainError ? extractErrorMessage(switchChainError) : null)

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
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
          isLoading={poolsLoading || tokensLoading}
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

      {step === 2 && depositActivity && (
        <EarnDepositResult
          activity={depositActivity}
          onDone={handleDone}
          onViewActivity={() => navigate(activityPath())}
        />
      )}
    </div>
  )
}
