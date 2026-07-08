import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useTokens } from '@/api/swap'
import { useTokenPrices } from '@/api/coin-gecko'
import { Skeleton } from '@/components/ui/skeleton'
import { useBalance } from '@oasisprotocol/privana-sdk'
import { formatUnits, parseUnits } from 'viem'
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi'
import { ArrowLeft, ArrowUpDown, EyeOff } from 'lucide-react'
import { extractErrorMessage } from '@/lib/errors'
import { activityPath } from '@/paths'
import { SWAPPABLE_TOKEN_IDS } from '@/config/tokens'
import { cn } from '@/lib/utils'
import { useResetBalanceCaches } from '@/hooks/use-reset-balance-caches'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import { AssetRow } from './AssetRow'
import { QuoteInfo } from './QuoteInfo'
import { ReviewStep } from './ReviewStep'
import { SwapResult } from './SwapResult'
import { useSwapQuote } from './useSwapQuote'
import { useSubmitSwap } from './useSubmitSwap'
import { useQuoteSummary } from './useQuoteSummary'
import type { AppChainId } from '@/wagmi-config'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId

// Desktop-only card surface (flat on mobile), matching SurfaceCard's look so the
// swap form reads like the onboarding card on md+ but stays edge-to-edge on phones.
const DESKTOP_CARD =
  'md:rounded-3xl md:bg-white md:p-6 md:dark:bg-card ' +
  'md:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_2px_0_rgba(87,97,117,0.05),0_4px_10px_0_rgba(87,97,117,0.08)] ' +
  'md:dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_1px_2px_0_rgba(0,0,0,0.4),0_4px_12px_0_rgba(0,0,0,0.5)]'

export const SwapDashboard = () => {
  const [step, setStep] = useState(0)
  const { data, isLoading, error } = useTokens()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain, error: switchChainError } = useSwitchChain()
  const resetBalanceCaches = useResetBalanceCaches()
  const navigate = useNavigate()
  const { activities } = useActivity()
  const [fromTokenId, setFromTokenId] = useState('')
  const [toTokenId, setToTokenId] = useState('')
  const [fromAmount, setFromAmount] = useState('')
  const [swapActivityId, setSwapActivityId] = useState<string | null>(null)
  const tokens = useMemo(
    () => (data?.tokens ?? []).filter(t => (SWAPPABLE_TOKEN_IDS as string[]).includes(t.token_id)),
    [data],
  )
  const fromToken = tokens.find(t => t.token_id === fromTokenId)
  const toToken = tokens.find(t => t.token_id === toTokenId)
  const priceTokenIds = useMemo(
    () => [fromTokenId, toTokenId].filter((id): id is string => !!id),
    [fromTokenId, toTokenId],
  )
  const { data: prices } = useTokenPrices(priceTokenIds)
  const fromBalance = useBalance({
    tokenId: (fromTokenId || undefined) as `0x${string}` | undefined,
    enabled: !!fromTokenId,
  })
  const toBalance = useBalance({
    tokenId: (toTokenId || undefined) as `0x${string}` | undefined,
    enabled: !!toTokenId,
  })

  const insufficientFunds = useMemo(() => {
    if (fromToken?.token_decimals == null || !fromAmount || fromBalance.isLoading) return false
    try {
      return parseUnits(fromAmount, fromToken.token_decimals) > BigInt(fromBalance.balanceWei || '0')
    } catch {
      return false
    }
  }, [fromToken, fromAmount, fromBalance.isLoading, fromBalance.balanceWei])

  const {
    data: quoteData,
    loading: quoteLoading,
    error: quoteError,
    toAmount,
    toAmountExact,
    reset: resetQuote,
  } = useSwapQuote({
    fromTokenId,
    toTokenId,
    fromAmount,
    address,
    fromDecimals: fromToken?.token_decimals,
    toDecimals: toToken?.token_decimals,
    disabled: insufficientFunds,
  })

  const {
    execute: runSwap,
    loading: swapLoading,
    error: swapError,
    reset: resetSubmit,
  } = useSubmitSwap({
    onSuccess: resetBalanceCaches,
  })

  const summary = useQuoteSummary(quoteData, fromToken, toToken, prices)

  const fromFiat = useMemo(() => {
    if (!prices || !fromAmount || fromToken?.token_decimals == null) return undefined
    const price = prices[fromTokenId]
    if (price == null) return undefined
    try {
      const units = parseUnits(fromAmount, fromToken.token_decimals)
      const asNum = Number(formatUnits(units, fromToken.token_decimals))
      return Number.isFinite(asNum) ? asNum * price : undefined
    } catch {
      return undefined
    }
  }, [prices, fromTokenId, fromAmount, fromToken])
  const toFiat = useMemo(() => {
    if (!prices || !toAmountExact || toToken?.token_decimals == null) return undefined
    const price = prices[toTokenId]
    if (price == null) return undefined
    const asNum = Number(toAmountExact)
    return Number.isFinite(asNum) ? asNum * price : undefined
  }, [prices, toTokenId, toAmountExact, toToken])

  const isCorrectChain = chainId === CHAIN_ID
  // Guard against submitting a stale quote while the user is still typing
  // (debounce window) by requiring the quote's amount to match the current input.
  const quoteMatchesInput = (() => {
    if (!quoteData || fromToken?.token_decimals == null) return false
    try {
      return parseUnits(fromAmount, fromToken.token_decimals).toString() === quoteData.from_amount
    } catch {
      return false
    }
  })()
  const canSwap =
    !!quoteData && !!walletClient && !!address && isCorrectChain && !insufficientFunds && quoteMatchesInput

  const swapActivity = useMemo(() => {
    if (!swapActivityId) return undefined
    const found = activities.find(a => a.id === swapActivityId)
    return found?.type === 'swap' ? found : undefined
  }, [activities, swapActivityId])

  const handleSwap = async () => {
    if (!canSwap || !quoteData || !walletClient || !address || !fromToken || !toToken) return
    const id = await runSwap({
      quote: quoteData,
      walletClient,
      address,
      fromToken,
      toToken,
      rateLabel: summary.rateLabel,
      feeFiat: summary.totalFeeFiat,
    })
    if (id) {
      setSwapActivityId(id)
      setStep(2)
    }
  }

  const handleBack = () => {
    resetSubmit()
    setStep(0)
  }

  const handleDone = () => {
    resetSubmit()
    resetQuote()
    setSwapActivityId(null)
    setFromTokenId('')
    setToTokenId('')
    setFromAmount('')
    setStep(0)
  }

  const handleSwapDirection = () => {
    const prevFromId = fromTokenId
    setFromTokenId(toTokenId)
    setToTokenId(prevFromId)
    setFromAmount('')
    resetQuote()
  }

  // Both steps share the same card wrapper (desktop card, flat on mobile) with
  // the heading inside; only the content below the heading swaps per step.
  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      {step === 0 && (
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight leading-9">Swap</h1>
          <p className="text-muted-foreground text-sm font-normal leading-5">
            Choose the asset you want to swap &amp; the asset you wish to receive.
          </p>
        </div>
      )}
      {step === 1 && (
        <div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-foreground text-xl font-semibold tracking-tight">Review swap</h1>
            <div className="w-8" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Confirm before executing.</p>
        </div>
      )}

      {step !== 2 && switchChainError && (
        <p className="mt-4 text-sm text-center text-destructive">{extractErrorMessage(switchChainError)}</p>
      )}

      {step === 2 && swapActivity && (
        <SwapResult
          activity={swapActivity}
          onDone={handleDone}
          onViewActivity={() => navigate(activityPath())}
        />
      )}

      {step === 1 && data && (
        <ReviewStep
          fromToken={fromToken}
          toToken={toToken}
          fromAmount={fromAmount}
          toAmount={toAmount}
          summary={summary}
          quoteLoading={quoteLoading}
          canConfirm={canSwap}
          expiresAt={quoteData?.expires_at}
          toAmountExact={toAmountExact}
          isCorrectChain={isCorrectChain}
          onSwitchChain={() => switchChain({ chainId: CHAIN_ID })}
          onConfirm={handleSwap}
          loading={swapLoading}
          error={swapError}
        />
      )}

      {step === 0 && isLoading && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="-my-4 flex items-center justify-center py-1">
            <Skeleton className="size-10 rounded-md" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-14 w-full" />
        </div>
      )}
      {step === 0 && error && <p className="mt-6">Failed to load tokens: {error.message}</p>}

      {step === 0 && data && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-normal text-muted-foreground">You pay</p>
            <AssetRow
              tokens={tokens}
              token={fromToken}
              disabledId={toTokenId}
              onTokenChange={id => {
                setFromTokenId(id)
                setFromAmount('')
              }}
              amount={fromAmount}
              onAmountChange={setFromAmount}
              balance={{ wei: fromBalance.balanceWei, loading: fromBalance.isLoading }}
              amountError={insufficientFunds ? 'Insufficient funds' : null}
              fiatValue={fromFiat}
              onMax={() => {
                if (fromToken?.token_decimals == null || !fromBalance.balanceWei) return
                setFromAmount(formatUnits(BigInt(fromBalance.balanceWei), fromToken.token_decimals))
              }}
            />
          </div>

          <div className="-my-4 flex items-center justify-center py-1">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleSwapDirection}
              disabled={!fromTokenId && !toTokenId}
              aria-label="Swap direction"
              className="bg-muted text-muted-foreground hover:bg-muted/80"
            >
              <ArrowUpDown className="size-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-normal text-muted-foreground">You receive</p>
            <AssetRow
              tokens={tokens}
              token={toToken}
              disabledId={fromTokenId}
              onTokenChange={setToTokenId}
              amount={toAmount}
              readOnly
              loading={quoteLoading}
              balance={{ wei: toBalance.balanceWei, loading: toBalance.isLoading }}
              fiatValue={toFiat}
              balanceLabel="Receive (incl. fees)"
            />
          </div>

          {quoteError && (
            <div className="rounded-lg border bg-card p-4 text-sm">
              <p className="text-destructive">Failed to fetch quote: {quoteError}</p>
            </div>
          )}

          {quoteData && <QuoteInfo summary={summary} />}

          <div className="flex gap-5 w-full">
            {!isCorrectChain ? (
              <Button
                size="lg"
                className="flex-1 h-14 text-base"
                onClick={() => switchChain({ chainId: CHAIN_ID })}
              >
                Switch Network
              </Button>
            ) : (
              <Button
                size="lg"
                className="flex-1 h-14 text-base"
                disabled={!canSwap || quoteLoading}
                onClick={() => setStep(1)}
              >
                Review swap
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 px-0.5 text-xs font-medium text-muted-foreground">
            <EyeOff className="size-4 shrink-0" />
            <span>Private execution — no public trace</span>
          </div>
        </div>
      )}
    </div>
  )
}
