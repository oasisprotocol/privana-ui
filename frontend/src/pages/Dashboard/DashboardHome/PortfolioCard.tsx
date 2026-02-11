import { FC, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PortfolioChange } from './PortfolioChange'

type PortfolioCardProps = {
  disabled?: boolean
  title: string
  amount: string
  changePercentage: string
  icon: ReactNode
}

export const PortfolioCard: FC<PortfolioCardProps> = ({
  disabled,
  title,
  amount,
  changePercentage,
  icon,
}) => {
  return (
    <Card className={cn('p-8 flex flex-col gap-6', disabled ? 'opacity-50' : '')}>
      {disabled ? (
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
        <Button className="w-full" disabled={disabled}>
          Trade
        </Button>
      </CardFooter>
    </Card>
  )
}
