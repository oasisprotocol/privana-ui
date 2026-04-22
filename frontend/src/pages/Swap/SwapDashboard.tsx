import React, { useEffect, useMemo, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTokens } from '@/api/swap'
import { useTokenPrices } from '@/api/coin-gecko'
import { Skeleton } from '@/components/ui/skeleton'
import { useBalance } from '@oasisprotocol/flexvaults-sdk'
import { formatUnits, parseUnits } from 'viem'
import { useAccount, useWalletClient, useSwitchChain, useConfig } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowUpDown, ExternalLink, EyeOff } from 'lucide-react'
import { AssetRow } from './AssetRow'
import { QuoteInfo } from './QuoteInfo'
import { ReviewStep } from './ReviewStep'
import { useSwapQuote } from './useSwapQuote'
import { useSubmitSwap } from './useSubmitSwap'

// TODO: Validate once designs are ready if we need these steps
const steps = ['1. Execute your private swap', '2. Review', '3. Enjoy']

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)

export const SwapDashboard = () => {
  const [step, setStep] = useState(0)
  const { data, isLoading, error } = useTokens()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain } = useSwitchChain()
  const wagmiConfig = useConfig()
  const queryClient = useQueryClient()
  const explorerUrl = wagmiConfig.chains.find(c => c.id === CHAIN_ID)?.blockExplorers?.default.url
  const [fromTokenId, setFromTokenId] = useState('')
  const [toTokenId, setToTokenId] = useState('')
  const [fromAmount, setFromAmount] = useState('')
  const tokens = useMemo(() => data?.tokens ?? [], [data])
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
    result: swapResult,
  } = useSubmitSwap({
    onSuccess: () => {
      setFromTokenId('')
      setToTokenId('')
      setFromAmount('')
      resetQuote()
      setStep(0)
      queryClient.invalidateQueries({ queryKey: ['accounting-balance'] })
    },
  })

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
    if (!prices || !toAmount || toToken?.token_decimals == null) return undefined
    const price = prices[toTokenId]
    if (price == null) return undefined
    try {
      const units = parseUnits(toAmount, toToken.token_decimals)
      const asNum = Number(formatUnits(units, toToken.token_decimals))
      return Number.isFinite(asNum) ? asNum * price : undefined
    } catch {
      return undefined
    }
  }, [prices, toTokenId, toAmount, toToken])

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

  const handleSwap = () => {
    if (!canSwap || !quoteData || !walletClient || !address) return
    runSwap(quoteData, walletClient, address)
  }

  useEffect(() => {
    if (step === 1 && !quoteData && !swapLoading) setStep(0)
  }, [step, quoteData, swapLoading])

  const handleSwapDirection = () => {
    const prevFromId = fromTokenId
    setFromTokenId(toTokenId)
    setToTokenId(prevFromId)
    setFromAmount('')
    resetQuote()
  }

  return (
    <>
      <div>
        <Breadcrumb className="py-2 h-10">
          <BreadcrumbList>
            {steps.map((label, i) => (
              <React.Fragment key={i}>
                <BreadcrumbItem className="text-input-focused">
                  {i === step ? <BreadcrumbPage className="underline">{label}</BreadcrumbPage> : label}
                </BreadcrumbItem>
                {i < steps.length - 1 && <BreadcrumbSeparator className="pl-4" />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Separator />

      {isLoading && (
        <div className="flex flex-col gap-4 w-full max-w-145 mx-auto bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-full max-w-80" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="flex items-center justify-center py-1">
            <Skeleton className="size-10 rounded-md" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      )}
      {error && <p>Failed to load tokens: {error.message}</p>}

      {data && step === 0 && (
        <div className="flex flex-col gap-4 w-full max-w-145 mx-auto bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
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
              disabled={swapLoading}
              fiatValue={fromFiat}
              onMax={() => {
                if (fromToken?.token_decimals == null || !fromBalance.balanceWei) return
                setFromAmount(formatUnits(BigInt(fromBalance.balanceWei), fromToken.token_decimals))
              }}
            />
          </div>

          <div className="flex items-center justify-center py-1">
            <button
              type="button"
              onClick={handleSwapDirection}
              disabled={swapLoading || (!fromTokenId && !toTokenId)}
              aria-label="Swap direction"
              className="flex items-center justify-center size-10 rounded-md border bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpDown className="size-4 text-primary" />
            </button>
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
              disabled={swapLoading}
              fiatValue={toFiat}
              balanceLabel="Receive (incl. fees)"
            />
          </div>

          {quoteError && (
            <div className="rounded-lg border bg-card p-4 text-sm">
              <p className="text-destructive">Failed to fetch quote: {quoteError}</p>
            </div>
          )}

          {quoteData && (
            <QuoteInfo quote={quoteData} fromToken={fromToken} toToken={toToken} prices={prices} />
          )}

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
                disabled={!canSwap}
                onClick={() => setStep(1)}
              >
                Swap
              </Button>
            )}
          </div>

          {/* TODO: temporary section until we have designs */}
          {swapResult && (
            <div className="rounded-lg border bg-card p-4 text-sm">
              <p className="text-foreground font-medium">Swap initiated</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mt-2 text-sm">
                <dt className="text-muted-foreground">Swap ID</dt>
                <dd className="truncate">{swapResult.swap_id}</dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{swapResult.status}</dd>
                {swapResult.tx_hash && (
                  <>
                    <dt className="text-muted-foreground">Tx hash</dt>
                    <dd className="break-all">
                      {explorerUrl ? (
                        <a
                          href={`${explorerUrl}/tx/${swapResult.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center gap-2 mr-2"
                        >
                          {swapResult.tx_hash}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        swapResult.tx_hash
                      )}
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 px-0.5 text-xs font-medium text-muted-foreground">
            <EyeOff className="size-4 shrink-0" />
            <span>Private execution — no public trace</span>
          </div>
        </div>
      )}

      {data && step === 1 && quoteData && (
        <ReviewStep
          fromToken={fromToken}
          toToken={toToken}
          fromAmount={fromAmount}
          toAmount={toAmount}
          quote={quoteData}
          prices={prices}
          onBack={() => setStep(0)}
          onConfirm={handleSwap}
          loading={swapLoading}
          error={swapError}
        />
      )}
    </>
  )
}
