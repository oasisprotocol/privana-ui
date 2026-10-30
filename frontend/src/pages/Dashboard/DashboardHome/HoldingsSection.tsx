import { type ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { SurfaceCard } from '@/components/SurfaceCard'
import { TokenAmount } from '@/components/TokenAmount'
import { useHoldings } from '@/hooks/useHoldings'
import { formatFiat } from '@/lib/tokens'
import { tradePath } from '@/paths'

const HoldingRow = ({
  to,
  icon,
  name,
  subtitle,
  fiat,
}: {
  to: string
  icon: ReactNode
  name: string
  subtitle: ReactNode
  fiat: number | undefined
}) => (
  <Link
    to={to}
    viewTransition
    className="flex items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-secondary/40"
  >
    {icon}
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold leading-tight text-foreground">{name}</p>
      <p className="mt-0.5 truncate text-xs tabular-nums text-muted-foreground">{subtitle}</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-semibold tabular-nums text-foreground">
        {fiat != null ? formatFiat(fiat) : '-'}
      </p>
    </div>
    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
  </Link>
)

export const HoldingsSection = () => {
  const { tokenHoldings } = useHoldings()

  if (tokenHoldings.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base md:text-lg md:tracking-tight font-semibold text-foreground">Holdings</h2>
      <SurfaceCard className="overflow-hidden">
        {tokenHoldings.map(holding => (
          <HoldingRow
            key={holding.symbol}
            to={tradePath()}
            icon={
              <span className="size-9 shrink-0 overflow-hidden rounded-full">
                {getTokenIcon(holding.symbol, 36)}
              </span>
            }
            name={holding.name}
            subtitle={<TokenAmount amount={holding.amount} token={holding} withSymbol />}
            fiat={holding.fiat}
          />
        ))}
      </SurfaceCard>
    </div>
  )
}
