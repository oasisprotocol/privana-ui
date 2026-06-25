import * as React from 'react'
import { cn } from '@/lib/utils'

const BASE =
  'rounded-2xl bg-white dark:bg-card shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_2px_0_rgba(87,97,117,0.05),0_4px_10px_0_rgba(87,97,117,0.08)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_1px_2px_0_rgba(0,0,0,0.4),0_4px_12px_0_rgba(0,0,0,0.5)]'

export const SurfaceCard = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn(BASE, className)} {...props} />
)
