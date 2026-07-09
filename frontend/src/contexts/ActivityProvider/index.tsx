import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useAccount } from 'wagmi'
import { ActivityContext, type Activity } from './context'

type ActivityState = { address: string | null; activities: Activity[] }

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const { address } = useAccount()
  const owner = address?.toLowerCase() ?? null
  const [state, setState] = useState<ActivityState>({ address: owner, activities: [] })
  if (state.address !== owner) setState({ address: owner, activities: [] })

  const addActivity = useCallback((activity: Activity) => {
    setState(prev => ({ ...prev, activities: [activity, ...prev.activities] }))
  }, [])

  const updateActivity = useCallback((id: string, patch: Partial<Activity>) => {
    setState(prev => ({
      ...prev,
      activities: prev.activities.map(a => (a.id === id ? ({ ...a, ...patch } as Activity) : a)),
    }))
  }, [])

  const removeActivity = useCallback((id: string) => {
    setState(prev => ({ ...prev, activities: prev.activities.filter(a => a.id !== id) }))
  }, [])

  const activities = state.activities

  const value = useMemo(
    () => ({ activities, addActivity, updateActivity, removeActivity }),
    [activities, addActivity, updateActivity, removeActivity],
  )

  return <ActivityContext value={value}>{children}</ActivityContext>
}
