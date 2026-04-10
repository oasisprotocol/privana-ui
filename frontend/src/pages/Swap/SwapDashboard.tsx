import React, { useEffect, useRef, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PoweredByHyperliquid } from '@/components/PoweredByHyperliquid'
import { executeSwap, getQuote, useTokens } from '@/api/swap'
import type { QuoteResponse } from '@/api/swap'
import { Skeleton } from '@/components/ui/skeleton'
import { signLockMessage, createLockExpiry, useBalance } from '@oasisprotocol/flexvaults-sdk'
import { formatUnits, parseUnits } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const steps = ['1. Execute your private swap', '2. Review', '3. Enjoy']
import { SYMBOL_OVERRIDES, getDecimals } from '@/lib/tokens'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)
const ACCOUNTING_CONTRACT = import.meta.env.VITE_ACCOUNTING_CONTRACT_ADDRESS
const SERVICE_ADDRESS = import.meta.env.VITE_SERVICE_ADDRESS

export const SwapDashboard = () => {
  const [step] = useState(0)
  const { data, isLoading, error } = useTokens()
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [fromTokenId, setFromTokenId] = useState<string>('')
  const [toTokenId, setToTokenId] = useState<string>('')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const fromBalance = useBalance({
    tokenId: (fromTokenId || undefined) as `0x${string}` | undefined,
    enabled: !!fromTokenId,
  })
  const toBalance = useBalance({
    tokenId: (toTokenId || undefined) as `0x${string}` | undefined,
    enabled: !!toTokenId,
  })
  const debouncedFromAmount = useDebouncedValue(fromAmount)
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [quoteRefetchKey, setQuoteRefetchKey] = useState(0)

  const insufficientFunds =
    !!fromTokenId &&
    !!debouncedFromAmount &&
    !fromBalance.isLoading &&
    (() => {
      try {
        return parseUnits(debouncedFromAmount, getDecimals(fromTokenId)) > BigInt(fromBalance.balanceWei || '0')
      } catch {
        return false
      }
    })()

  const quoteAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!fromTokenId || !toTokenId || !debouncedFromAmount || !address || insufficientFunds) {
      setQuoteData(null)
      setQuoteError(null)
      setToAmount('')
      return
    }

    quoteAbortRef.current?.abort()
    const abort = new AbortController()
    quoteAbortRef.current = abort

    setQuoteLoading(true)
    setQuoteError(null)

    getQuote({
      fromTokenId,
      toTokenId,
      fromAmount: parseUnits(debouncedFromAmount, getDecimals(fromTokenId)).toString(),
      userAddress: address,
    })
      .then(data => {
        if (!abort.signal.aborted) {
          setQuoteData(data)
          setToAmount(formatUnits(BigInt(data.to_amount_estimate), getDecimals(toTokenId)))
        }
      })
      .catch(err => {
        if (!abort.signal.aborted) setQuoteError(err instanceof Error ? err.message : 'Failed to fetch quote')
      })
      .finally(() => {
        if (!abort.signal.aborted) setQuoteLoading(false)
      })

    return () => abort.abort()
  }, [fromTokenId, toTokenId, debouncedFromAmount, address, quoteRefetchKey, insufficientFunds])

  useEffect(() => {
    if (!quoteData) return
    const msUntilExpiry = quoteData.expires_at * 1000 - Date.now()
    if (msUntilExpiry <= 0) {
      setQuoteData(null)
      setToAmount('')
      return
    }
    const timer = setTimeout(() => {
      setQuoteData(null)
      setQuoteRefetchKey(k => k + 1)
    }, msUntilExpiry)
    return () => clearTimeout(timer)
  }, [quoteData])

  const [swapLoading, setSwapLoading] = useState(false)
  const [swapError, setSwapError] = useState<string | null>(null)
  const [swapResult, setSwapResult] = useState<{ swap_id: string; status: string } | null>(null)

  const canSwap = !!quoteData && !!walletClient && !!address

  const handleSwap = async () => {
    if (!canSwap) return
    setSwapLoading(true)
    setSwapError(null)
    setSwapResult(null)
    try {
      const expiry = createLockExpiry(60)

      const signature = await signLockMessage({
        walletClient,
        chainId: CHAIN_ID,
        verifyingContract: ACCOUNTING_CONTRACT,
        message: {
          userAddress: address,
          serviceAddress: SERVICE_ADDRESS,
          tokenId: quoteData.from_token_id as `0x${string}`,
          amount: parseUnits(quoteData.from_amount, getDecimals(quoteData.from_token_id)),
          expiry,
        },
      })

      const result = await executeSwap({
        quote_id: quoteData.quote_id,
        user_address: address,
        lock_signature: signature,
        lock_expiry: Number(expiry),
      })

      setSwapResult(result)
      setFromTokenId('')
      setToTokenId('')
      setFromAmount('')
      setToAmount('')
      setQuoteData(null)
    } catch (err) {
      setSwapError(err instanceof Error ? err.message : 'Swap failed')
    } finally {
      setSwapLoading(false)
    }
  }

  const tokens = data?.tokens ?? []

  const getTokenLabel = (token: (typeof tokens)[number]) =>
    SYMBOL_OVERRIDES[token.token_id] ?? token.symbol ?? token.token_type_name
  const findToken = (id: string) => tokens.find(t => t.token_id === id)

  const formatBalance = (balanceWei: string, tokenId: string) =>
    Number(formatUnits(BigInt(balanceWei || '0'), getDecimals(tokenId))).toFixed(6)

  const handleFromTokenChange = (tokenId: string) => {
    setFromTokenId(tokenId)
    setFromAmount('')
  }

  const handleToTokenChange = (tokenId: string) => {
    setToTokenId(tokenId)
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
        <div className="flex flex-col gap-6 w-full max-w-[580px]">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-medium text-foreground leading-8">Asset selection</h2>
            <p className="text-sm text-muted-foreground">
              Choose asset you want to swap &amp; asset you wish to receive.
            </p>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex flex-col gap-2">
              <Label>Asset</Label>
              <Select value={fromTokenId} onValueChange={handleFromTokenChange}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map(token => (
                    <SelectItem key={token.token_id} value={token.token_id}>
                      {getTokenLabel(token)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label>Amount</Label>
              <Input
                className="h-8"
                type="text"
                inputMode="decimal"
                placeholder={`0.00 ${fromTokenId ? getTokenLabel(findToken(fromTokenId)!) : ''}`}
                value={fromAmount}
                onChange={e => setFromAmount(e.target.value)}
              />
              <div className="text-xs text-muted-foreground flex gap-2">
                Available:{' '}
                {fromTokenId ? (
                  fromBalance.isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    `${formatBalance(fromBalance.balanceWei, fromTokenId)} ${getTokenLabel(findToken(fromTokenId)!)}`
                  )
                ) : (
                  '-'
                )}
              </div>
              {insufficientFunds && <p className="text-xs text-destructive">Insufficient funds</p>}
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex flex-col gap-2">
              <Label>Asset</Label>
              <Select value={toTokenId} onValueChange={handleToTokenChange}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map(token => (
                    <SelectItem key={token.token_id} value={token.token_id}>
                      {getTokenLabel(token)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label>Amount</Label>
              <div className="relative">
                <Input
                  className={`h-8 ${quoteLoading ? 'opacity-50' : ''}`}
                  type="text"
                  inputMode="decimal"
                  placeholder={`0.00 ${toTokenId ? getTokenLabel(findToken(toTokenId)!) : ''}`}
                  value={toAmount}
                  readOnly
                />
                {quoteLoading && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <div className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Available:{' '}
                {toTokenId
                  ? toBalance.isLoading
                    ? '...'
                    : `${formatBalance(toBalance.balanceWei, toTokenId)} ${getTokenLabel(findToken(toTokenId)!)}`
                  : '-'}
              </p>
            </div>
          </div>

          {(quoteLoading || quoteError || quoteData) && (
            <div className="rounded-lg border bg-card p-4 text-sm">
              {quoteLoading && (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
              {quoteError && <p className="text-destructive">Failed to fetch quote: {quoteError}</p>}
              {quoteData && (
                <div className="flex flex-col gap-4">
                  <p>Raw quote data</p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">Quote ID</dt>
                    <dd className="truncate">{quoteData.quote_id}</dd>
                    <dt className="text-muted-foreground">From amount</dt>
                    <dd>{quoteData.from_amount}</dd>
                    <dt className="text-muted-foreground">Estimated output</dt>
                    <dd>{quoteData.to_amount_estimate}</dd>
                    <dt className="text-muted-foreground">Gross output</dt>
                    <dd>{quoteData.to_amount_gross}</dd>
                    <dt className="text-muted-foreground">Min output</dt>
                    <dd>{quoteData.to_amount_min}</dd>
                    <dt className="text-muted-foreground">Fee</dt>
                    <dd>
                      {quoteData.fee_amount} ({quoteData.fee_bps} bps)
                    </dd>
                    <dt className="text-muted-foreground">Tool</dt>
                    <dd>{quoteData.tool_used ?? '-'}</dd>
                    <dt className="text-muted-foreground">Expires</dt>
                    <dd>{new Date(quoteData.expires_at * 1000).toLocaleTimeString()}</dd>
                  </dl>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-5 w-full">
            <Button size="sm" className="flex-1" disabled={!canSwap || swapLoading} onClick={handleSwap}>
              {swapLoading ? 'Signing & submitting...' : 'Swap'}
            </Button>
          </div>

          {swapError && <p className="text-sm text-destructive">{swapError}</p>}
          {swapResult && (
            <div className="rounded-lg border bg-card p-4 text-sm">
              <p className="text-foreground font-medium">Swap initiated</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mt-2 text-sm">
                <dt className="text-muted-foreground">Swap ID</dt>
                <dd className="truncate">{swapResult.swap_id}</dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{swapResult.status}</dd>
              </dl>
            </div>
          )}
        </div>
      )}

      <PoweredByHyperliquid />
    </>
  )
}
