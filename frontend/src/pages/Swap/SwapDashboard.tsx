import React, { useMemo, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PoweredByHyperliquid } from '@/components/PoweredByHyperliquid'
import { useTokens } from '@/api/swap'
import { Skeleton } from '@/components/ui/skeleton'
import { useBalance } from '@oasisprotocol/flexvaults-sdk'
import { parseUnits } from 'viem'
import { useAccount, useWalletClient, useSwitchChain, useConfig } from 'wagmi'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { ExternalLink } from 'lucide-react'
import { AssetRow } from './AssetRow'
import { useSwapQuote } from './useSwapQuote'
import { useSubmitSwap } from './useSubmitSwap'

// TODO: Validate once designs are ready if we need these steps
const steps = ['1. Execute your private swap', '2. Review', '3. Enjoy']

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)

export const SwapDashboard = () => {
  const step = 0
  const { data, isLoading, error } = useTokens()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain } = useSwitchChain()
  const wagmiConfig = useConfig()
  const explorerUrl = wagmiConfig.chains.find(c => c.id === CHAIN_ID)?.blockExplorers?.default.url
  const [fromTokenId, setFromTokenId] = useState('')
  const [toTokenId, setToTokenId] = useState('')
  const [fromAmount, setFromAmount] = useState('')
  const tokens = useMemo(() => data?.tokens ?? [], [data])
  const fromToken = tokens.find(t => t.token_id === fromTokenId)
  const toToken = tokens.find(t => t.token_id === toTokenId)
  const fromBalance = useBalance({
    tokenId: (fromTokenId || undefined) as `0x${string}` | undefined,
    enabled: !!fromTokenId,
  })
  const toBalance = useBalance({
    tokenId: (toTokenId || undefined) as `0x${string}` | undefined,
    enabled: !!toTokenId,
  })

  const debouncedFromAmount = useDebouncedValue(fromAmount)

  const insufficientFunds = useMemo(() => {
    if (fromToken?.token_decimals == null || !debouncedFromAmount || fromBalance.isLoading) return false
    try {
      return parseUnits(debouncedFromAmount, fromToken.token_decimals) > BigInt(fromBalance.balanceWei || '0')
    } catch {
      return false
    }
  }, [fromToken, debouncedFromAmount, fromBalance.isLoading, fromBalance.balanceWei])

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
    },
  })

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
    !!quoteData &&
    !!walletClient &&
    !!address &&
    isCorrectChain &&
    !insufficientFunds &&
    quoteMatchesInput

  const handleSwap = () => {
    if (!canSwap || !quoteData || !walletClient || !address) return
    runSwap(quoteData, walletClient, address)
  }

  return (
    <>
      <div>
        <div className="text-foreground text-3xl font-semibold mb-3">Execute your private swap</div>
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

      {isLoading && <Skeleton className="h-70 w-full" />}
      {error && <p>Failed to load tokens: {error.message}</p>}

      {data && (
        <div className="flex flex-col gap-6 w-full max-w-145">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-medium text-foreground leading-8">Asset selection</h2>
            <p className="text-sm text-muted-foreground">
              Choose asset you want to swap &amp; asset you wish to receive.
            </p>
          </div>

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
          />

          <AssetRow
            tokens={tokens}
            token={toToken}
            disabledId={fromTokenId}
            onTokenChange={setToTokenId}
            amount={toAmount}
            readOnly
            loading={quoteLoading}
            balance={{ wei: toBalance.balanceWei, loading: toBalance.isLoading }}
          />

          {(quoteLoading || quoteError) && (
            <div className="rounded-lg border bg-card p-4 text-sm">
              {quoteLoading && (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}

              {quoteError && <p className="text-destructive">Failed to fetch quote: {quoteError}</p>}
            </div>
          )}

          <div className="flex gap-5 w-full">
            {!isCorrectChain ? (
              <Button size="sm" className="flex-1" onClick={() => switchChain({ chainId: CHAIN_ID })}>
                Switch Network
              </Button>
            ) : (
              <Button size="sm" className="flex-1" disabled={!canSwap || swapLoading} onClick={handleSwap}>
                {swapLoading ? 'Signing & submitting...' : 'Swap'}
              </Button>
            )}
          </div>

          {swapError && <p className="text-sm text-destructive">{swapError}</p>}

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
        </div>
      )}

      <PoweredByHyperliquid />
    </>
  )
}
