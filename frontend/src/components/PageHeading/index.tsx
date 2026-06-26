import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeadingProps = {
  title: ReactNode
  description: ReactNode
  className?: string
}

export const PageHeading = ({ title, description, className }: PageHeadingProps) => (
  <div className={cn('w-full max-w-145 mx-auto flex flex-col gap-3', className)}>
    <h1 className="text-foreground text-3xl font-semibold leading-9">{title}</h1>
    <p className="text-muted-foreground text-sm font-normal leading-5">{description}</p>
  </div>
)
