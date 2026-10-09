import { useEffect, useState } from 'react'
import { formatUnits } from 'viem'
import { formatTokenAmount } from '@oasisprotocol/privana-sdk'
import { getQuote } from '@/api/swap'
import type { QuoteResponse } from '@/api/swap'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
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

  const inputId = enabled ? `${fromTokenId}|${toTokenId}|${debouncedFromAmount}|${address}` : ''
  const inputKey = enabled ? `${inputId}|${refetchKey}` : ''

  const [result, setResult] = useState<{
    inputId: string
    key: string
    quote: QuoteResponse
    refreshAt: number
  } | null>(null)
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null)
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || fromBaseUnits == null) return
    const abort = new AbortController()
    getQuote(
      {
        fromTokenId,
        toTokenId,
        fromAmount: fromBaseUnits.toString(),
        userAddress: address,
      },
      abort.signal,
    )
      .then(quote => {
        if (abort.signal.aborted) return
        const refreshAt = Math.min(quote.expires_at, Math.floor(Date.now() / 1000) + QUOTE_REFRESH_SECONDS)
        setResult({ inputId, key: inputKey, quote, refreshAt })
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
  }, [enabled, inputKey, inputId, fromTokenId, toTokenId, fromBaseUnits, address])

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

  const shown = data ? result : null
  useEffect(() => {
    if (!shown) return
    const msUntil = (seconds: number) => Math.max(0, seconds * 1000 - Date.now())
    const notice = setTimeout(
      () => setRefreshNotice(shown.key),
      msUntil(shown.refreshAt - REFRESH_NOTICE_SECONDS),
    )
    const refresh = setTimeout(() => setRefetchKey(k => k + 1), msUntil(shown.refreshAt))
    return () => {
      clearTimeout(notice)
      clearTimeout(refresh)
    }
  }, [shown])
  const refreshing = !!shown && (loading || refreshNotice === shown.key)

  const reset = () => setRefetchKey(k => k + 1)

  return { data, loading, refreshing, error, toAmount, toAmountExact, reset }
}
