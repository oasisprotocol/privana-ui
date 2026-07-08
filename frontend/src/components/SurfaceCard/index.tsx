import * as React from 'react'
import { cn } from '@/lib/utils'

const BASE = 'rounded-2xl bg-white dark:bg-card shadow-[var(--card-shadow)]'

export const SurfaceCard = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn(BASE, className)} {...props} />
)
