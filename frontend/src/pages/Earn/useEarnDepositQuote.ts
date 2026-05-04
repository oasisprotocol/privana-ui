import { useEffect, useState } from 'react'
import { getDepositQuote, type DepositQuoteResponse } from '@/api/earn'
import { useQuoteExpiry } from '@/hooks/use-quote-expiry'

type Params = {
  poolId: string
  amount: string
  userAddress: string | undefined
  enabled?: boolean
  pauseRefetch?: boolean
}

export const useEarnDepositQuote = ({
  poolId,
  amount,
  userAddress,
  enabled: enabledProp = true,
  pauseRefetch,
}: Params) => {
  const [refetchKey, setRefetchKey] = useState(0)

  const enabled = enabledProp && !!poolId && !!amount && !!userAddress

  const inputKey = enabled ? `${poolId}|${amount}|${userAddress}|${refetchKey}` : ''

  const [result, setResult] = useState<{ key: string; quote: DepositQuoteResponse } | null>(null)
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null)

  useEffect(() => {
    if (!enabled || !userAddress) return
    const abort = new AbortController()
    getDepositQuote({ poolId, amount, userAddress }, abort.signal)
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
  }, [enabled, inputKey, poolId, amount, userAddress])

  const data = result?.key === inputKey ? result.quote : null
  const error = errorState?.key === inputKey ? errorState.message : null
  const loading = enabled && !data && !error

  const { expired } = useQuoteExpiry({
    data,
    pauseRefetch,
    onRefetch: () => setRefetchKey(k => k + 1),
  })

  const reset = () => setRefetchKey(k => k + 1)

  return { data, loading, error, expired, reset }
}
