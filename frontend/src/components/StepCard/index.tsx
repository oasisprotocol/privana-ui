import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StepCardProps = {
  className?: string
  children: ReactNode
}

export const StepCard = ({ className, children }: StepCardProps) => (
  <div className={cn('flex flex-col gap-4 w-full max-w-120 mx-auto', className)}>{children}</div>
)
