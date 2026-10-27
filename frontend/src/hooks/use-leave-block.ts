import { useEffect } from 'react'
import { useBlocker } from 'react-router'

export const useLeaveBlock = (blocked: boolean) => {
  const blocker = useBlocker(blocked)

  useEffect(() => {
    if (blocker.state === 'blocked') blocker.reset()
  }, [blocker])

  useEffect(() => {
    if (!blocked) return
    const confirmLeave = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', confirmLeave)
    return () => window.removeEventListener('beforeunload', confirmLeave)
  }, [blocked])
}
