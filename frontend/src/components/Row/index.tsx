import type { ReactNode } from 'react'

type RowProps = { label: string; value: ReactNode }

export const Row = ({ label, value }: RowProps) => (
  <div className="flex items-center justify-between text-xs font-medium leading-4">
    <p className="text-muted-foreground">{label}</p>
    <div className="text-foreground">{value}</div>
  </div>
)
