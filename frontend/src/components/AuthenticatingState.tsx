import { Loader2, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const AuthBadge = () => (
  <span className="flex size-14 items-center justify-center rounded-full bg-muted">
    <ShieldCheck className="size-7 text-muted-foreground" />
  </span>
)

export const AuthenticatingState = ({
  title,
  subtitle,
  className,
  children,
}: {
  title: string
  subtitle?: ReactNode
  className?: string
  children?: ReactNode
}) => (
  <div className={cn('flex flex-col items-center text-center', className)}>
    <AuthBadge />
    <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
    {subtitle != null && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
    <Loader2 className="mt-8 size-6 animate-spin text-muted-foreground" />
    {children}
  </div>
)
