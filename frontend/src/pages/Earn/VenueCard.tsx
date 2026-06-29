import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { SurfaceCard } from '@/components/SurfaceCard'
import { earnCreatePath, earnWithdrawPath } from '@/paths'
import { formatApyBps } from '@/lib/apy'
import { ProtocolLabel } from './ProtocolLabel'

export type Venue = {
  poolId: string
  tokenId: string
  strategyKey: string
  asset: string
  chain: string
  apyBps: number
  /** Formatted earning amount when the user has a position here, otherwise null. */
  earning: string | null
}

type VenueCardProps = Venue & {
  hasAvailableBalance: boolean
  onRequestDeposit: () => void
}

export const VenueCard = ({
  poolId,
  strategyKey,
  asset,
  chain,
  apyBps,
  earning,
  hasAvailableBalance,
  onRequestDeposit,
}: VenueCardProps) => {
  const isEarning = earning != null

  return (
    <SurfaceCard className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-base font-semibold leading-tight text-foreground">
            <ProtocolLabel strategy={strategyKey} iconSize={24} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {asset} on {chain}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-chart-positive px-2.5 py-1 text-xs font-semibold text-white">
          {formatApyBps(apyBps)} APY
        </span>
      </div>

      {isEarning ? (
        <>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Earning</span>
            <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {earning}
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            {hasAvailableBalance ? (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to={earnCreatePath(poolId)} viewTransition>
                  Add funds
                </Link>
              </Button>
            ) : (
              <Button size="lg" className="w-full sm:w-auto" onClick={onRequestDeposit}>
                Add funds
              </Button>
            )}
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
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
          {hasAvailableBalance ? (
            <Button asChild size="lg" className="w-full sm:w-auto sm:self-center">
              <Link to={earnCreatePath(poolId)} viewTransition>
                Start earning
              </Link>
            </Button>
          ) : (
            <Button size="lg" className="w-full sm:w-auto sm:self-center" onClick={onRequestDeposit}>
              Start earning
            </Button>
          )}
        </>
      )}
    </SurfaceCard>
  )
}
