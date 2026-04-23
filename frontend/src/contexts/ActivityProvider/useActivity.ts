import { use } from 'react'
import { ActivityContext } from './context'

export const useActivity = () => {
  const ctx = use(ActivityContext)
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider')
  return ctx
}
