import { useEffect } from 'react'
import { useBlocker } from 'react-router'

export const useLeaveBlock = (blocked: boolean, stepBack?: () => void) => {
  // Browser back (a POP) steps back inside the flow while there is a step to go back to.
  const blocker = useBlocker(({ historyAction }) => blocked || (historyAction === 'POP' && !!stepBack))

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    blocker.reset()
    if (!blocked) stepBack?.()
  }, [blocker, blocked, stepBack])

  useEffect(() => {
    if (!blocked) return
    const confirmLeave = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', confirmLeave)
    return () => window.removeEventListener('beforeunload', confirmLeave)
  }, [blocked])
}
