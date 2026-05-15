import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ActivityContext, type Activity, type SwapActivity } from './context'
import { SwapStatusPoller } from './SwapStatusPoller'

const isPollableSwap = (a: Activity): a is SwapActivity & { swapId: string } =>
  a.type === 'swap' && a.status === 'in-progress' && a.swapId != null

const isPersistable = (a: Activity): boolean =>
  (a.type === 'swap' && a.swapId != null) ||
  (a.type === 'earn' && (a.depositId != null || a.withdrawId != null))

const STORAGE_KEY = 'privana-activities'

const loadFromStorage = (): Activity[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Activity[]
  } catch {
    return []
  }
}

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const [activities, setActivities] = useState<Activity[]>(loadFromStorage)

  // Only persist entries that reached the backend
  useEffect(() => {
    try {
      const persistable = activities.filter(isPersistable)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
    } catch {
      // ignore quota / serialization errors
    }
  }, [activities])

  const addActivity = useCallback((activity: Activity) => {
    setActivities(prev => [activity, ...prev])
  }, [])

  const updateActivity = useCallback((id: string, patch: Partial<Activity>) => {
    setActivities(prev => prev.map(a => (a.id === id ? ({ ...a, ...patch } as Activity) : a)))
  }, [])

  const removeActivity = useCallback((id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id))
  }, [])

  const pendingCount = useMemo(() => activities.filter(a => a.status === 'in-progress').length, [activities])

  const value = useMemo(
    () => ({ activities, pendingCount, addActivity, updateActivity, removeActivity }),
    [activities, pendingCount, addActivity, updateActivity, removeActivity],
  )

  return (
    <ActivityContext value={value}>
      {activities.filter(isPollableSwap).map(a => (
        <SwapStatusPoller key={a.id} activity={a} />
      ))}
      {children}
    </ActivityContext>
  )
}
