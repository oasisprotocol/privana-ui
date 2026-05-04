import { useEffect, useRef, useState } from 'react'

type Quote = { quote_id: string; expires_at: number }

type Params<T extends Quote> = {
  data: T | null
  pauseRefetch?: boolean
  onRefetch: () => void
}

export const useQuoteExpiry = <T extends Quote>({ data, pauseRefetch, onRefetch }: Params<T>) => {
  const [expiredQuoteId, setExpiredQuoteId] = useState<string | null>(null)
  const expired = !!data && data.quote_id === expiredQuoteId

  const onRefetchRef = useRef(onRefetch)
  useEffect(() => {
    onRefetchRef.current = onRefetch
  }, [onRefetch])

  useEffect(() => {
    if (!data) return
    const msUntilExpiry = data.expires_at * 1000 - Date.now()
    const onExpire = () => {
      if (pauseRefetch) setExpiredQuoteId(data.quote_id)
      else onRefetchRef.current()
    }
    const timer = setTimeout(onExpire, Math.max(0, msUntilExpiry))
    return () => clearTimeout(timer)
  }, [data, pauseRefetch])

  return { expired }
}
