import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export const Notice = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
    <Icon className="mt-0.5 size-4 shrink-0 text-amber-500" />
    <p className="text-xs text-foreground">{children}</p>
  </div>
)
