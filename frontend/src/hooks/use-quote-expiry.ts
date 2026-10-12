import { useEffect, useRef, useState } from 'react'

type Quote = { quote_id: string; expires_at: number }

type Params<T extends Quote> = {
  data: T | null
  onRefetch: () => void
  maxAgeSeconds?: number
  noticeSeconds?: number
}

export const useQuoteExpiry = <T extends Quote>({
  data,
  onRefetch,
  maxAgeSeconds,
  noticeSeconds,
}: Params<T>) => {
  const onRefetchRef = useRef(onRefetch)
  useEffect(() => {
    onRefetchRef.current = onRefetch
  }, [onRefetch])
  const [noticeFor, setNoticeFor] = useState<T | null>(null)

  useEffect(() => {
    if (!data) return
    const expiresAt = data.expires_at * 1000
    const refetchAt =
      maxAgeSeconds == null ? expiresAt : Math.min(expiresAt, Date.now() + maxAgeSeconds * 1000)
    const msUntil = (at: number) => Math.max(0, at - Date.now())
    const timer = setTimeout(() => onRefetchRef.current(), msUntil(refetchAt))
    const notice =
      noticeSeconds == null
        ? undefined
        : setTimeout(() => setNoticeFor(data), msUntil(refetchAt - noticeSeconds * 1000))
    return () => {
      clearTimeout(timer)
      clearTimeout(notice)
    }
  }, [data, maxAgeSeconds, noticeSeconds])

  return { refreshSoon: data != null && noticeFor === data }
}
