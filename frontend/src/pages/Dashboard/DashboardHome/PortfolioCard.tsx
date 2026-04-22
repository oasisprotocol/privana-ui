import { FC, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Link, type To } from 'react-router'

type PortfolioCardProps = {
  buttonAction?: () => void
  buttonLabel?: string
  disabled?: boolean
  icon: ReactNode
  title: string
  to?: To
}

export const PortfolioCard: FC<PortfolioCardProps> = ({
  buttonAction,
  buttonLabel,
  disabled,
  icon,
  title,
  to,
}) => {
  const renderAsLink = !!to && !disabled && !buttonAction

  return (
    <Card className={cn('p-8 flex flex-col gap-6 items-center', disabled && 'opacity-50')}>
      <div className="flex items-center justify-center [&_svg]:size-12 text-foreground">{icon}</div>
      <p className="w-full text-xl font-semibold text-muted-foreground uppercase text-center truncate">
        {title}
      </p>
      <Button
        onClick={buttonAction}
        size="lg"
        className="w-full disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        asChild={renderAsLink}
      >
        {renderAsLink ? (
          <Link to={to} viewTransition>
            {buttonLabel}
          </Link>
        ) : (
          (buttonLabel ?? 'Trade')
        )}
      </Button>
    </Card>
  )
}
