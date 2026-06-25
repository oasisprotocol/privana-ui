import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type RowProps = {
  label: string
  value: ReactNode
  size?: 'sm' | 'md'
  className?: string
  mutedValue?: boolean
}

export const Row = ({ label, value, size = 'sm', className, mutedValue }: RowProps) => (
  <div
    className={cn(
      'flex items-center justify-between font-medium',
      size === 'md' ? 'text-sm leading-5' : 'text-xs leading-4',
      className,
    )}
  >
    <p className="text-muted-foreground">{label}</p>
    <div className={mutedValue ? 'text-muted-foreground' : 'text-foreground'}>{value}</div>
  </div>
)
