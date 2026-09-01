import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { SurfaceCard } from '@/components/SurfaceCard'
import { earnCreatePath, earnWithdrawPath } from '@/paths'
import { formatApyBps } from '@/lib/apy'
import { ProtocolIcon } from './ProtocolLabel'
import { VenueAPY } from './VenueAPY'
import { getProtocolLabel } from '@/config/protocols'

export type Venue = {
  poolId: string
  tokenId: string
  strategyKey: string
  asset: string
  chain: string
  apyBps: number
  /** Formatted earning amount when the user has a position here, otherwise null. */
  earning: string | null
  /** Formatted estimated daily accrual, e.g. "0.03 USDC", or null. */
  earningToday: string | null
}

type VenueCardProps = Venue & {
  hasAvailableBalance: boolean
  onRequestDeposit: () => void
}

const ApyPill = ({ apyBps, className }: { apyBps: number; className?: string }) => (
  <span
    className={`inline-flex items-center rounded-full bg-chart-positive/15 px-2 py-0.5 text-xs font-semibold text-chart-positive ${className ?? ''}`}
  >
    {formatApyBps(apyBps)} APY
  </span>
)

export const VenueCard = ({
  poolId,
  strategyKey,
  asset,
  chain,
  apyBps,
  earning,
  earningToday,
  hasAvailableBalance,
  onRequestDeposit,
}: VenueCardProps) => {
  const isEarning = earning != null

  const depositButton = (label: string, size: 'sm' | 'lg', className: string) =>
    hasAvailableBalance ? (
      <Button asChild size={size} className={className}>
        <Link to={earnCreatePath(poolId)} viewTransition>
          {label}
        </Link>
      </Button>
    ) : (
      <Button size={size} className={className} onClick={onRequestDeposit}>
        {label}
      </Button>
    )

  return (
    <>
      {/* Desktop: horizontal row */}
      <SurfaceCard className="hidden items-center gap-5 p-5 md:flex">
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-base [&>img]:size-full [&>svg]:size-7">
          <ProtocolIcon strategy={strategyKey} size={28} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold leading-tight text-foreground">
              {getProtocolLabel(strategyKey)}
            </span>
            <ApyPill apyBps={apyBps} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span>
              Asset <span className="font-medium text-foreground">{asset}</span>
            </span>
            <span>
              Chain <span className="font-medium text-foreground">{chain}</span>
            </span>
            {isEarning && (
              <span>
                Earning <span className="font-medium text-foreground">{earning}</span>{' '}
                {earningToday && <span className="text-chart-positive">(+{earningToday} today)</span>}
              </span>
            )}
          </div>
        </div>
        <div className="hidden flex-1 items-center justify-center xl:flex">
          <VenueAPY poolId={poolId} className="h-10 w-36" />
        </div>
        <div className="ml-auto flex shrink-0 justify-end gap-2 xl:ml-0">
          {isEarning ? (
            <>
              {depositButton('Add funds', 'lg', 'shrink-0')}
              <Button asChild variant="outline" size="lg" className="shrink-0">
                <Link to={earnWithdrawPath(poolId)} viewTransition>
                  Remove funds
                </Link>
              </Button>
            </>
          ) : (
            depositButton('Start earning', 'lg', 'shrink-0')
          )}
        </div>
      </SurfaceCard>

      {/* Mobile: stacked card */}
      <SurfaceCard className="flex flex-col gap-4 p-5 md:hidden">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-base [&>img]:size-full [&>svg]:size-6">
            <ProtocolIcon strategy={strategyKey} size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold leading-tight text-foreground">
              {getProtocolLabel(strategyKey)}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {asset} on {chain}
            </p>
          </div>
          <ApyPill apyBps={apyBps} className="px-2.5 py-1" />
        </div>

        {isEarning ? (
          <>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Earning</span>
              <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {earning}
              </span>
              {earningToday && (
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium text-chart-positive">+{earningToday}</span> today
                </span>
              )}
            </div>
            <VenueAPY poolId={poolId} className="h-12 w-full" />
            <div className="grid grid-cols-2 gap-2">
              {depositButton('Add funds', 'lg', 'w-full')}
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to={earnWithdrawPath(poolId)} viewTransition>
                  Remove funds
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Deposit {asset} to start earning {formatApyBps(apyBps)} APY.
            </p>
            <VenueAPY poolId={poolId} className="h-12 w-full" />
            {depositButton('Start earning', 'lg', 'w-full')}
          </>
        )}
      </SurfaceCard>
    </>
  )
}
