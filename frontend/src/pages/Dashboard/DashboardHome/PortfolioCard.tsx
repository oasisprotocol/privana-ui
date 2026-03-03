import { FC, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PortfolioChange } from './PortfolioChange'
import { Link, type To } from 'react-router'

type PortfolioCardProps = {
  amount: string
  buttonAction?: () => void
  buttonLabel?: string
  changePercentage: string
  disabled?: boolean
  icon: ReactNode
  title: string
  to?: To
}

export const PortfolioCard: FC<PortfolioCardProps> = ({
  amount,
  buttonAction,
  buttonLabel,
  changePercentage,
  disabled,
  icon,
  title,
  to,
}) => {
  const renderAsLink = !!to && !disabled && !buttonAction

  return (
    <Card className={cn('p-8 flex flex-col gap-6', !to ? 'opacity-50' : '')}>
      {!to ? (
        <div className="flex justify-between items-start">
          {icon}
          <Badge variant="secondary">Coming soon</Badge>
        </div>
      ) : (
        <div>{icon}</div>
      )}

      <CardHeader className="p-0 space-y-1.5">
        <p className="text-[15px] font-bold text-muted-foreground uppercase">{title}</p>
        <PortfolioChange amount={amount} changePercentage={changePercentage} />
      </CardHeader>

      <CardFooter className="p-0 mt-auto">
        <Button
          onClick={buttonAction}
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
      </CardFooter>
    </Card>
  )
}
