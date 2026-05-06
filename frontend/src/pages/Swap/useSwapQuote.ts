import { useEffect, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { getQuote } from '@/api/swap'
import type { QuoteResponse } from '@/api/swap'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useQuoteExpiry } from '@/hooks/use-quote-expiry'
import { formatAmountTrimmed } from '@/lib/tokens'

type Params = {
  fromTokenId: string
  toTokenId: string
  fromAmount: string
  address: string | undefined
  fromDecimals: number | null | undefined
  toDecimals: number | null | undefined
  disabled?: boolean
}

export const useSwapQuote = ({
  fromTokenId,
  toTokenId,
  fromAmount,
  address,
  fromDecimals,
  toDecimals,
  disabled,
}: Params) => {
  const debouncedFromAmount = useDebouncedValue(fromAmount)
  const [refetchKey, setRefetchKey] = useState(0)

  const enabled =
    !!fromTokenId &&
    !!toTokenId &&
    !!debouncedFromAmount &&
    !!address &&
    !disabled &&
    fromDecimals != null &&
    toDecimals != null

  const inputId = enabled ? `${fromTokenId}|${toTokenId}|${debouncedFromAmount}|${address}` : ''
  const inputKey = enabled ? `${inputId}|${refetchKey}` : ''

  const [result, setResult] = useState<{ inputId: string; key: string; quote: QuoteResponse } | null>(null)
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null)

  useEffect(() => {
    if (!enabled) return
    const abort = new AbortController()
    getQuote(
      {
        fromTokenId,
        toTokenId,
        fromAmount: parseUnits(debouncedFromAmount, fromDecimals).toString(),
        userAddress: address,
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
  }, [enabled, inputKey, inputId, fromTokenId, toTokenId, debouncedFromAmount, address, fromDecimals])

  const data = enabled && result?.inputId === inputId ? result.quote : null
  const error = errorState?.key === inputKey ? errorState.message : null
  const loading = enabled && (!result || result.key !== inputKey) && !error
  const toAmount =
    data && toDecimals != null ? formatAmountTrimmed(BigInt(data.to_amount_estimate), toDecimals) : ''
  const toAmountExact =
    data && toDecimals != null ? formatUnits(BigInt(data.to_amount_estimate), toDecimals) : ''

  const { expired } = useQuoteExpiry({
    data,
    onRefetch: () => setRefetchKey(k => k + 1),
  })

  const reset = () => setRefetchKey(k => k + 1)

  return { data, loading, error, toAmount, toAmountExact, reset, expired }
}
