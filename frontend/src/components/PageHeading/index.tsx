import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'

type PageHeadingProps = {
  title: ReactNode
  description: ReactNode
}

export const PageHeading = ({ title, description }: PageHeadingProps) => (
  <>
    <div className="flex flex-col gap-3">
      <h1 className="text-foreground text-3xl font-semibold leading-9">{title}</h1>
      <p className="text-muted-foreground text-xl font-normal leading-7 max-w-xl">{description}</p>
    </div>
    <Separator />
  </>
)
