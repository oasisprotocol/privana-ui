import { useEffect, useState } from 'react'

export type BootPhase = 'loading' | 'confirming' | 'done'

const CONFIRM_MS = 1100

export function useBootPhase(loading: boolean): BootPhase {
  const [booted, setBooted] = useState(!loading)
  const phase: BootPhase = booted ? 'done' : loading ? 'loading' : 'confirming'

  useEffect(() => {
    if (phase !== 'confirming') return
    const timer = setTimeout(() => setBooted(true), CONFIRM_MS)
    return () => clearTimeout(timer)
  }, [phase])

  return phase
}
