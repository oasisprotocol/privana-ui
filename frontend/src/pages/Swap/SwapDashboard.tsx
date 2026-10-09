import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useTokens } from '@/api/swap'
import { useTokenPrices } from '@/api/prices'
import { Skeleton } from '@/components/ui/skeleton'
import { maxAmount, useBalance } from '@oasisprotocol/privana-sdk'
import { useConnection } from 'wagmi'
import { ArrowLeft, ArrowUpDown, EyeOff } from 'lucide-react'
import { activityPath } from '@/paths'
import { SWAPPABLE_TOKEN_IDS } from '@/config/tokens'
import { cn } from '@/lib/utils'
import { amountFiat, amountInputError, exceedsAmount, parseAmount } from '@/lib/tokens'
import { useRefreshBalanceCaches } from '@/hooks/use-reset-balance-caches'
import { DESKTOP_CARD } from '@/lib/surface'
import { useResolvedActivity } from '@/hooks/use-merged-activity'
import { AssetRow } from './AssetRow'
import { QuoteInfo } from './QuoteInfo'
import { ReviewStep } from './ReviewStep'
import { SwapSettings } from './SwapSettings'
import { parseSlippage, slippageLabel } from './slippage'
import { SwapResult } from './SwapResult'
import { useSwapQuote } from './useSwapQuote'
import { useSubmitSwap } from './useSubmitSwap'
import { useQuoteSummary } from './useQuoteSummary'
import { useSigningClient } from '@/hooks/use-signing-client'

export const SwapDashboard = () => {
  const [step, setStep] = useState(0)
  const { data, isLoading, error } = useTokens()
  const { address } = useConnection()
  const walletClient = useSigningClient()
  const refreshBalanceCaches = useRefreshBalanceCaches()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [fromTokenId, setFromTokenId] = useState('')
  const [toTokenId, setToTokenId] = useState(() => {
    const requested = searchParams.get('to') ?? ''
    return (SWAPPABLE_TOKEN_IDS as string[]).includes(requested) ? requested : ''
  })
  const [fromAmount, setFromAmount] = useState('')
  const [slippageInput, setSlippageInput] = useState('')
  const customSlippage = parseSlippage(slippageInput)
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
    if (fromBalance.isLoading) return false
    return exceedsAmount(fromAmount, fromToken?.token_decimals, BigInt(fromBalance.balanceWei || '0'))
  }, [fromToken, fromAmount, fromBalance.isLoading, fromBalance.balanceWei])

  const {
    data: quoteData,
    loading: quoteLoading,
    refreshing: quoteRefreshing,
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
    toSymbol: toToken?.token_symbol,
    slippage: customSlippage == null ? undefined : customSlippage / 100,
    disabled: insufficientFunds,
  })

  const {
    execute: runSwap,
    loading: swapLoading,
    error: swapError,
    reset: resetSubmit,
  } = useSubmitSwap({
    onSuccess: refreshBalanceCaches,
    // The quote on screen carries the nonce the pending operation holds;
    // re-quote so a retry signs against the current one.
    onRefused: () => {
      resetQuote()
      setStep(1)
    },
  })

  const summary = useQuoteSummary(quoteData, fromToken, toToken, prices)

  const fromFiat = useMemo(
    () => amountFiat(fromAmount, fromToken?.token_decimals, prices?.[fromTokenId]),
    [prices, fromTokenId, fromAmount, fromToken],
  )
  const toFiat = useMemo(
    () => amountFiat(toAmountExact, toToken?.token_decimals, prices?.[toTokenId]),
    [prices, toTokenId, toAmountExact, toToken],
  )

  // Guard against submitting a stale quote while the user is still typing
  // (debounce window) by requiring the quote's amount to match the current input.
  const quoteMatchesInput =
    !!quoteData && parseAmount(fromAmount, fromToken?.token_decimals)?.toString() === quoteData.from_amount
  const canSwap =
    !!quoteData && !quoteLoading && !!walletClient && !!address && !insufficientFunds && quoteMatchesInput

  const resolvedActivity = useResolvedActivity(swapActivityId)
  const swapActivity = resolvedActivity?.type === 'swap' ? resolvedActivity : undefined

  // Reset the flow when the connected account changes. ActivityProvider drops its
  // list per-address, so a swap tracked for the previous account would no longer
  // be found and the result step would render a blank card.
  const prevAddressRef = useRef(address)
  useEffect(() => {
    if (prevAddressRef.current === address) return
    prevAddressRef.current = address
    resetSubmit()
    resetQuote()
    setSwapActivityId(null)
    setFromTokenId('')
    setToTokenId('')
    setFromAmount('')
    setStep(0)
  }, [address, resetSubmit, resetQuote])

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
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground text-3xl font-semibold tracking-tight leading-9">Swap</h1>
            <p className="text-muted-foreground text-sm font-normal leading-5">
              Choose the asset you want to swap.
            </p>
          </div>
          <SwapSettings slippage={slippageInput} onSlippageChange={setSlippageInput} />
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
          quoteRefreshing={quoteRefreshing}
          toAmountExact={toAmountExact}
          minReceived={quoteData?.to_amount_min}
          slippageLabel={slippageLabel(customSlippage)}
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
            <p className="text-sm font-semibold text-foreground">You pay</p>
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
              amountError={
                amountInputError(fromAmount, fromToken?.token_decimals) ??
                (insufficientFunds ? 'Insufficient funds' : null)
              }
              fiatValue={fromFiat}
              onMax={() => {
                if (fromToken?.token_decimals == null || !fromBalance.balanceWei) return
                const token = { symbol: fromToken.token_symbol ?? '', decimals: fromToken.token_decimals }
                setFromAmount(maxAmount(BigInt(fromBalance.balanceWei), token).input)
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
            <p className="text-sm font-semibold text-foreground">You receive</p>
            <AssetRow
              tokens={tokens}
              token={toToken}
              disabledId={fromTokenId}
              onTokenChange={setToTokenId}
              amount={toAmount}
              readOnly
              loading={quoteLoading}
              refreshing={quoteRefreshing}
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
            <Button
              size="lg"
              className="flex-1 h-14 text-base"
              disabled={!canSwap || quoteLoading}
              onClick={() => setStep(1)}
            >
              Review swap
            </Button>
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
