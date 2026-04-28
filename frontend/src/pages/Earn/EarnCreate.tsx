import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAccount, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { earnKeys, useDepositQuote, useEarnPools, type DepositQuoteResponse, type EarnPool } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { StepsNav } from '@/components/StepsNav'
import { activityPath, earnCreatePath } from '@/paths'
import { ConfigureStep } from './ConfigureStep'
import { formatApyBps, PROTOCOL_LABELS } from './labels'
import { ReviewStep } from './ReviewStep'
import { useSubmitEarnDeposit } from './useSubmitEarnDeposit'

// TODO: remove once earn contract is deployed
const MOCK_POOLS: EarnPool[] = [
  {
    pool_id: 'mock-aave-v3-usdc',
    token_id: '0x330ba47d00c7ce3018deee017b319fd7cc6473a2ddc9e6eba6ebb4207be15279',
    strategy: 'aave-v3',
    total_assets: '0',
    apy_bps: 480,
    status: 'active',
  },
]

const steps = ['1. Configure', '2. Review']

export const EarnCreate = () => {
  const { poolId } = useParams<{ poolId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState(0)

  const handlePoolIdChange = (id: string | undefined) => {
    navigate(earnCreatePath(id), { replace: true })
  }

  const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading } = useTokens()

  const useMockPools = import.meta.env.DEV && !!poolsError
  const pools = useMockPools ? MOCK_POOLS : (poolsData?.pools ?? [])
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
    data: quoteData,
    isLoading: quoteLoading,
    error: quoteError,
  } = useDepositQuote(
    { poolId: poolId ?? '', amount: amountBaseUnits, userAddress: address ?? '' },
    onReview && !!address && !!amountBaseUnits && !!pool,
  )

  // TODO: remove once earn contract is deployed
  const useMockQuote =
    import.meta.env.DEV && onReview && !!amountBaseUnits && !!pool && (!!quoteError || !address)
  const mockQuote: DepositQuoteResponse | undefined =
    useMockQuote && pool
      ? {
          pool_id: pool.pool_id,
          token_id: pool.token_id,
          amount: amountBaseUnits,
          shares_estimate: amountBaseUnits,
          exchange_rate: '1000000000000000000',
          pool_address: '0x0000000000000000000000000000000000000000',
          transfer_nonce: 0,
        }
      : undefined
  const quote = quoteData ?? mockQuote

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
          quote={quote}
          isLoading={poolsLoading || tokensLoading}
          quoteLoading={quoteLoading && !useMockQuote}
          onBack={handleBack}
          onConfirm={handleConfirm}
          loading={depositLoading}
          error={depositError}
        />
      )}
    </div>
  )
}
