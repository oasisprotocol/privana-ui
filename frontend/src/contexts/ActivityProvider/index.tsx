import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ActivityContext, type Activity } from './context'

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const [activities, setActivities] = useState<Activity[]>([])

  const addActivity = useCallback((activity: Activity) => {
    setActivities(prev => [activity, ...prev])
  }, [])

  const updateActivity = useCallback((id: string, patch: Partial<Activity>) => {
    setActivities(prev => prev.map(a => (a.id === id ? ({ ...a, ...patch } as Activity) : a)))
  }, [])

  const removeActivity = useCallback((id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id))
  }, [])

  const value = useMemo(
    () => ({ activities, addActivity, updateActivity, removeActivity }),
    [activities, addActivity, updateActivity, removeActivity],
  )

  return <ActivityContext value={value}>{children}</ActivityContext>
}
