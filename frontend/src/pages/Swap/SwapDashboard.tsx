import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useTokens } from '@/api/swap'
import { useTokenPrices } from '@/api/coin-gecko'
import { Skeleton } from '@/components/ui/skeleton'
import { useBalance } from '@oasisprotocol/privana-sdk'
import { formatUnits, parseUnits } from 'viem'
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi'
import { ArrowUpDown, EyeOff } from 'lucide-react'
import { StepsNav } from '@/components/StepsNav'
import { extractErrorMessage } from '@/lib/errors'
import { activityPath } from '@/paths'
import { SWAPPABLE_TOKEN_IDS } from '@/config/tokens'
import { StepCard } from '@/components/StepCard'
import { useResetBalanceCaches } from '@/hooks/use-reset-balance-caches'
import { AssetRow } from './AssetRow'
import { QuoteInfo } from './QuoteInfo'
import { ReviewStep } from './ReviewStep'
import { useSwapQuote } from './useSwapQuote'
import { useSubmitSwap } from './useSubmitSwap'
import { useQuoteSummary } from './useQuoteSummary'

const steps = ['1. Configure', '2. Review']

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)

export const SwapDashboard = () => {
  const [step, setStep] = useState(0)
  const { data, isLoading, error } = useTokens()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain, error: switchChainError } = useSwitchChain()
  const resetBalanceCaches = useResetBalanceCaches()
  const navigate = useNavigate()
  const [fromTokenId, setFromTokenId] = useState('')
  const [toTokenId, setToTokenId] = useState('')
  const [fromAmount, setFromAmount] = useState('')
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

  const handleSwap = async () => {
    if (!canSwap || !quoteData || !walletClient || !address || !fromToken || !toToken) return
    const signed = await runSwap({
      quote: quoteData,
      walletClient,
      address,
      fromToken,
      toToken,
      rateLabel: summary.rateLabel,
      feeFiat: summary.feeFiat,
    })
    if (signed) navigate(activityPath())
  }

  const handleSwapDirection = () => {
    const prevFromId = fromTokenId
    setFromTokenId(toTokenId)
    setToTokenId(prevFromId)
    setFromAmount('')
    resetQuote()
  }

  return (
    <div>
      <StepsNav steps={steps} activeIndex={step} ariaLabel="Swap progress" />

      {switchChainError && (
        <p className="text-sm text-center text-destructive mb-4">{extractErrorMessage(switchChainError)}</p>
      )}

      {isLoading && (
        <StepCard>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-full max-w-80" />
          </div>
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
          <Skeleton className="h-12 w-full" />
        </StepCard>
      )}
      {error && <p>Failed to load tokens: {error.message}</p>}

      {data && step === 0 && (
        <StepCard>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-medium text-foreground leading-8">Make a swap</h2>
            <p className="text-sm text-muted-foreground">
              Choose asset you want to swap &amp; asset you wish to receive.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">You pay</p>
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
              size="icon-lg"
              onClick={handleSwapDirection}
              disabled={!fromTokenId && !toTokenId}
              aria-label="Swap direction"
            >
              <ArrowUpDown className="size-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">You receive</p>
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
                className="flex-1 h-12 text-base"
                onClick={() => switchChain({ chainId: CHAIN_ID })}
              >
                Switch Network
              </Button>
            ) : (
              <Button
                size="lg"
                className="flex-1 h-12 text-base"
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
        </StepCard>
      )}

      {data && step === 1 && (
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
          onBack={() => {
            resetSubmit()
            setStep(0)
          }}
          onConfirm={handleSwap}
          loading={swapLoading}
          error={swapError}
        />
      )}
    </div>
  )
}
