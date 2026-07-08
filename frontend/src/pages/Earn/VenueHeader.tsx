import { ProtocolIcon } from './ProtocolLabel'
import { getProtocolLabel } from './labels'
import { formatApyBps } from '@/lib/apy'

// Venue identity row: logo tile → name → "TICKER · CHAIN" → APY badge. Shared by
// the earn deposit review and withdraw configure screens.
type VenueHeaderProps = {
  strategyKey: string
  asset: string
  chain: string
  apyBps: number
}

export const VenueHeader = ({ strategyKey, asset, chain, apyBps }: VenueHeaderProps) => (
  <div className="flex w-full items-center gap-3">
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-base [&>img]:size-full [&>svg]:size-6">
      <ProtocolIcon strategy={strategyKey} size={24} />
    </span>
    <div className="min-w-0 flex-1">
      <div className="text-base font-semibold leading-tight text-foreground">
        {getProtocolLabel(strategyKey)}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {asset} · {chain}
      </p>
    </div>
    <span className="inline-flex shrink-0 items-center rounded-full bg-chart-positive/15 px-2.5 py-1 text-xs font-semibold text-chart-positive">
      {formatApyBps(apyBps)} APY
    </span>
  </div>
)
