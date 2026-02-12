import { type FC } from 'react'
import { isRouteErrorResponse } from 'react-router'

export const ErrorDisplay: FC<{
  error: unknown
  className?: string
}> = ({ error }) => {
  let message: string
  if (isRouteErrorResponse(error)) {
    message = error.statusText
  } else if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  } else {
    message = 'An unexpected error occurred'
  }

  return (
    <div className="flex flex-col flex-1 gap-4 justify-center items-center">
      <span className="text-foreground text-2xl font-medium">Something went wrong</span>
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  )
}
