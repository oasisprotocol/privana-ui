import { useEffect, useState } from 'react'
import type { ActivityStatus } from '@/contexts/ActivityProvider/context'

// Once an in-progress result screen has been shown this long, surface a
// reassurance + "view in activity" escape hatch instead of leaving the user on
// an indefinite spinner. Settlement is fire-and-forget (no status poller), so
// this is purely a presentation concern shared by the swap / earn deposit /
// earn withdraw result screens.
const SLOW_SETTLEMENT_MS = 20_000

export const useSlowSettlement = (status: ActivityStatus): boolean => {
  // Only ever flipped true by the timer (never reset synchronously in the
  // effect); the returned value is gated on `in-progress` so it reads false the
  // moment settlement resolves. Status transitions are terminal, so a resolved
  // activity never re-enters the slow state.
  const [reachedSlow, setReachedSlow] = useState(false)
  useEffect(() => {
    if (status !== 'in-progress') return
    const timer = window.setTimeout(() => setReachedSlow(true), SLOW_SETTLEMENT_MS)
    return () => window.clearTimeout(timer)
  }, [status])
  return status === 'in-progress' && reachedSlow
}
