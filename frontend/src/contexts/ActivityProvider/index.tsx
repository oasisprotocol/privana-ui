import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAccount } from 'wagmi'
import { ActivityContext, type Activity, type SwapActivity } from './context'
import { SwapStatusPoller } from './SwapStatusPoller'

const isPollableSwap = (a: Activity): a is SwapActivity & { swapId: string } =>
  a.type === 'swap' && a.status === 'in-progress' && a.swapId != null

const isPersistable = (a: Activity): boolean =>
  (a.type === 'swap' && a.swapId != null) ||
  (a.type === 'earn' && (a.depositId != null || a.withdrawId != null))

const STORAGE_PREFIX = 'privana-activities'

const storageKey = (address?: string): string | null =>
  address ? `${STORAGE_PREFIX}:${address.toLowerCase()}` : null

const loadFromStorage = (key: string | null): Activity[] => {
  if (!key) return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Activity[]
  } catch {
    return []
  }
}

type ActivityState = { key: string | null; activities: Activity[] }

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const { address } = useAccount()
  const key = useMemo(() => storageKey(address), [address])

  const [state, setState] = useState<ActivityState>(() => ({ key, activities: loadFromStorage(key) }))

  if (state.key !== key) {
    setState({ key, activities: loadFromStorage(key) })
  }

  // Only persist entries that reached the backend
  useEffect(() => {
    if (!key || state.key !== key) return
    try {
      localStorage.setItem(key, JSON.stringify(state.activities.filter(isPersistable)))
    } catch {
      // ignore quota / serialization errors
    }
  }, [state, key])

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
