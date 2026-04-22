import { useEffect, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { getQuote } from '@/api/swap'
import type { QuoteResponse } from '@/api/swap'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

type Params = {
  fromTokenId: string
  toTokenId: string
  fromAmount: string
  address: string | undefined
  fromDecimals: number | null | undefined
  toDecimals: number | null | undefined
  disabled?: boolean
  pauseRefetch?: boolean
}

export const useSwapQuote = ({
  fromTokenId,
  toTokenId,
  fromAmount,
  address,
  fromDecimals,
  toDecimals,
  disabled,
  pauseRefetch,
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

  const inputKey = enabled
    ? `${fromTokenId}|${toTokenId}|${debouncedFromAmount}|${address}|${refetchKey}`
    : ''

  const [result, setResult] = useState<{ key: string; quote: QuoteResponse } | null>(null)
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
        setResult({ key: inputKey, quote })
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
  }, [enabled, inputKey, fromTokenId, toTokenId, debouncedFromAmount, address, fromDecimals])

  const data = result?.key === inputKey ? result.quote : null
  const error = errorState?.key === inputKey ? errorState.message : null
  const loading = enabled && !data && !error
  const toAmount = data && toDecimals != null ? formatUnits(BigInt(data.to_amount_estimate), toDecimals) : ''

  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!data) return
    setExpired(false)
    const msUntilExpiry = data.expires_at * 1000 - Date.now()
    const onExpire = () => {
      if (pauseRefetch) setExpired(true)
      else setRefetchKey(k => k + 1)
    }
    if (msUntilExpiry <= 0) {
      onExpire()
      return
    }
    const timer = setTimeout(onExpire, msUntilExpiry)
    return () => clearTimeout(timer)
  }, [data, pauseRefetch])

  useEffect(() => {
    if (!pauseRefetch && expired) {
      setRefetchKey(k => k + 1)
      setExpired(false)
    }
  }, [pauseRefetch, expired])

  const reset = () => setRefetchKey(k => k + 1)

  return { data, loading, error, toAmount, reset, expired }
}
