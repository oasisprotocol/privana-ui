import { useEffect, useRef } from 'react'

type Quote = { quote_id: string; expires_at: number }

type Params<T extends Quote> = {
  data: T | null
  onRefetch: () => void
}

export const useQuoteExpiry = <T extends Quote>({ data, onRefetch }: Params<T>) => {
  const onRefetchRef = useRef(onRefetch)
  useEffect(() => {
    onRefetchRef.current = onRefetch
  }, [onRefetch])

  useEffect(() => {
    if (!data) return
    const msUntilExpiry = data.expires_at * 1000 - Date.now()
    const timer = setTimeout(() => onRefetchRef.current(), Math.max(0, msUntilExpiry))
    return () => clearTimeout(timer)
  }, [data])
}
