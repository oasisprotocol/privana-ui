import { FC, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PortfolioChange } from './PortfolioChange'
import { Link, type To } from 'react-router'

type PortfolioCardProps = {
  disabled?: boolean
  title: string
  amount: string
  changePercentage: string
  icon: ReactNode
  buttonLabel?: string
  to?: To
}

export const PortfolioCard: FC<PortfolioCardProps> = ({
  disabled,
  title,
  amount,
  changePercentage,
  icon,
  buttonLabel,
  to,
}) => {
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
          className="w-full disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          asChild={!!to && !disabled}
        >
          {to && !disabled ? (
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
