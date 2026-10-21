import { useEffect, useState } from 'react'

const COPIED_MS = 1500

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), COPIED_MS)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = (value: string) =>
    void navigator.clipboard.writeText(value).then(
      () => setCopied(true),
      () => {},
    )

  return { copied, copy }
}
