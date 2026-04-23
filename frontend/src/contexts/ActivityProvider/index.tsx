import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ActivityContext, type Activity, type SwapActivity } from './context'
import { SwapStatusPoller } from './SwapStatusPoller'

const isPollableSwap = (a: Activity): a is SwapActivity & { swapId: string } =>
  a.type === 'swap' && a.status === 'in-progress' && a.swapId != null

const STORAGE_KEY = 'flexvaults-activities'

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

  // Only persist entries that reached the backend (have a swapId)
  useEffect(() => {
    try {
      const persistable = activities.filter(a => a.swapId != null)
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

  const pendingCount = useMemo(() => activities.filter(a => a.status === 'in-progress').length, [activities])

  const value = useMemo(
    () => ({ activities, pendingCount, addActivity, updateActivity }),
    [activities, pendingCount, addActivity, updateActivity],
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
