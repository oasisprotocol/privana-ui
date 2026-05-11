import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StepCardProps = {
  className?: string
  children: ReactNode
}

export const StepCard = ({ className, children }: StepCardProps) => (
  <div
    className={cn(
      'flex flex-col gap-4 w-full max-w-120 mx-auto bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
      className,
    )}
  >
    {children}
  </div>
)
