import type { ReactNode } from 'react'

type PageHeadingProps = {
  title: ReactNode
  description: ReactNode
}

export const PageHeading = ({ title, description }: PageHeadingProps) => (
  <div className="w-full max-w-145 mx-auto flex flex-col gap-3">
    <h1 className="text-foreground text-3xl font-semibold leading-9">{title}</h1>
    <p className="text-muted-foreground text-sm font-normal leading-5">{description}</p>
  </div>
)
