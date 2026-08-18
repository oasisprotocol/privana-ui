import { type ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { SurfaceCard } from '@/components/SurfaceCard'
import { useHoldings } from '@/hooks/useHoldings'
import { formatAmount, formatFiat } from '@/lib/tokens'
import { formatApyBps } from '@/lib/apy'
import { earnPath, tradePath } from '@/paths'
import { ProtocolIcon } from '@/pages/Earn/ProtocolLabel'
import { getProtocolLabel } from '@/pages/Earn/labels'

const HoldingRow = ({
  to,
  icon,
  name,
  subtitle,
  fiat,
  badge,
}: {
  to: string
  icon: ReactNode
  name: string
  subtitle: string
  fiat: number | undefined
  badge?: string
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
      {badge && <p className="text-xs text-chart-positive">{badge}</p>}
    </div>
    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
  </Link>
)

export const HoldingsSection = () => {
  const { tokenHoldings, earnHoldings } = useHoldings()

  if (tokenHoldings.length === 0 && earnHoldings.length === 0) return null

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
            subtitle={`${formatAmount(holding.amount, holding.decimals)} ${holding.symbol}`}
            fiat={holding.fiat}
          />
        ))}
        {earnHoldings.map(holding => (
          <HoldingRow
            key={holding.poolId}
            to={earnPath()}
            icon={
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
                <ProtocolIcon strategy={holding.strategy ?? ''} size={36} />
              </span>
            }
            name={holding.strategy ? getProtocolLabel(holding.strategy) : 'Earn'}
            subtitle={
              holding.apyBps != null
                ? `${holding.symbol ?? ''} · ${formatApyBps(holding.apyBps)} APY`
                : (holding.symbol ?? '')
            }
            fiat={holding.fiat}
            badge="Earning"
          />
        ))}
      </SurfaceCard>
    </div>
  )
}
