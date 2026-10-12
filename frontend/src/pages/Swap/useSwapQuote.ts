import { useEffect, useState } from 'react'
import { formatUnits } from 'viem'
import { formatTokenAmount } from '@oasisprotocol/privana-sdk'
import { getQuote } from '@/api/swap'
import type { QuoteResponse } from '@/api/swap'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useQuoteExpiry } from '@/hooks/use-quote-expiry'
import { parseAmount } from '@/lib/tokens'

// Keep refreshing quote to have estimate and nonce up to date.
const QUOTE_REFRESH_SECONDS = 30
// Mark quote as refreshing shortly.
const REFRESH_NOTICE_SECONDS = 5

type Params = {
  fromTokenId: string
  toTokenId: string
  fromAmount: string
  address: string | undefined
  fromDecimals: number | null | undefined
  toDecimals: number | null | undefined
  toSymbol: string | null | undefined
  slippageFraction?: number
  disabled?: boolean
}

export const useSwapQuote = ({
  fromTokenId,
  toTokenId,
  fromAmount,
  address,
  fromDecimals,
  toDecimals,
  toSymbol,
  slippageFraction,
  disabled,
}: Params) => {
  const debouncedFromAmount = useDebouncedValue(fromAmount)
  const [refetchKey, setRefetchKey] = useState(0)

  const fromBaseUnits = parseAmount(debouncedFromAmount, fromDecimals)
  const positiveAmount = fromBaseUnits != null && fromBaseUnits > 0n

  const enabled =
    !!fromTokenId &&
    !!toTokenId &&
    positiveAmount &&
    !!address &&
    !disabled &&
    fromDecimals != null &&
    toDecimals != null

  const inputId = enabled
    ? `${fromTokenId}|${toTokenId}|${debouncedFromAmount}|${address}|${slippageFraction ?? 'auto'}`
    : ''
  const inputKey = enabled ? `${inputId}|${refetchKey}` : ''

  const [result, setResult] = useState<{ inputId: string; key: string; quote: QuoteResponse } | null>(null)
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null)

  useEffect(() => {
    if (!enabled || fromBaseUnits == null) return
    const abort = new AbortController()
    getQuote(
      {
        fromTokenId,
        toTokenId,
        fromAmount: fromBaseUnits.toString(),
        userAddress: address,
        slippageFraction,
      },
      abort.signal,
    )
      .then(quote => {
        if (abort.signal.aborted) return
        setResult({ inputId, key: inputKey, quote })
        setErrorState(null)
      })
      .catch(err => {
        if (abort.signal.aborted) return
        setErrorState({
          key: inputKey,
          message: err instanceof Error ? err.message : 'Failed to fetch quote',
        })
      })
    return () => abort.abort()
  }, [enabled, inputKey, inputId, fromTokenId, toTokenId, fromBaseUnits, address, slippageFraction])

  const fresh = enabled && result?.key === inputKey ? result.quote : null
  const error = errorState?.key === inputKey ? errorState.message : null
  const stale = enabled && !error && result?.inputId === inputId ? result.quote : null
  const data = fresh ?? stale
  const loading = enabled && !fresh && !error
  const toAmount =
    data && toDecimals != null
      ? formatTokenAmount(
          data.to_amount_estimate,
          { symbol: toSymbol ?? '', decimals: toDecimals },
          { context: 'quote' },
        ).display
      : ''
  const toAmountExact =
    data && toDecimals != null ? formatUnits(BigInt(data.to_amount_estimate), toDecimals) : ''

  const { refreshSoon } = useQuoteExpiry({
    data,
    onRefetch: () => setRefetchKey(k => k + 1),
    maxAgeSeconds: QUOTE_REFRESH_SECONDS,
    noticeSeconds: REFRESH_NOTICE_SECONDS,
  })
  const refreshing = !!data && (loading || refreshSoon)

  const reset = () => setRefetchKey(k => k + 1)

  return { data, loading, refreshing, error, toAmount, toAmountExact, reset }
}
