import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

const remainingSeconds = (expiresAt: number) => Math.max(0, expiresAt - Math.floor(Date.now() / 1000))

type QuoteCountdownProps = {
  quoteLoading?: boolean
  expiresAt?: number
}

export const QuoteCountdown = ({ quoteLoading, expiresAt }: QuoteCountdownProps) => {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!expiresAt) return
    const id = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (!quoteLoading && !expiresAt) return null

  const remaining = expiresAt ? remainingSeconds(expiresAt) : 0

  return (
    <p className="text-xs font-medium leading-4 text-muted-foreground">
      Quote will update in{' '}
      {quoteLoading || !expiresAt ? (
        <Loader2 className="inline size-3 animate-spin align-[-2px]" />
      ) : (
        <span className="font-bold">{remaining}s</span>
      )}
    </p>
  )
}
