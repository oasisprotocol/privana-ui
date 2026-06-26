import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { PageHeading } from '@/components/PageHeading'
import { useFunds } from '@/hooks/useFunds'
import { useActiveStrategies } from './useActiveStrategies'
import { EarnBalance } from './EarnBalance'
import { VenueCard, type Venue } from './VenueCard'

const VenueCardSkeleton = () => <Skeleton className="h-44 w-full rounded-2xl" />

export const EarnDashboard = () => {
  const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading, error: tokensError } = useTokens()
  const { earningFiatValue, bestApyBps, pricesError } = useFunds()
  const { strategies: activePositions, isLoading: positionsLoading } = useActiveStrategies()
  const isLoading = poolsLoading || tokensLoading || positionsLoading

  const venues = useMemo<Venue[]>(() => {
    if (!poolsData || !tokensData) return []
    const tokensById = new Map(tokensData.tokens.map(t => [t.token_id, t]))
    const earningByPool = new Map(activePositions.map(p => [p.poolId, p.earning]))
    return poolsData.pools
      .filter(p => p.status === 'active')
      .map(p => {
        const token = tokensById.get(p.token_id)
        return {
          poolId: p.pool_id,
          strategyKey: p.strategy,
          asset: token?.token_symbol ?? '—',
          chain: token?.chain_name ?? '—',
          apyBps: p.apy_bps,
          earning: earningByPool.get(p.pool_id) ?? null,
        }
      })
  }, [poolsData, tokensData, activePositions])

  return (
    <>
      <PageHeading
        title="Earn"
        description="Where your funds are earning — withdraw anytime."
        className="max-w-200"
      />

      <div className="w-full max-w-200 mx-auto mt-8 flex flex-col gap-8">
        <EarnBalance earningFiatValue={earningFiatValue} bestApyBps={bestApyBps} pricesError={pricesError} />

        {(poolsError || tokensError) && <p className="text-destructive">Unable to load earn pools</p>}

        {(isLoading || venues.length > 0) && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Venues</p>
            {isLoading ? <VenueCardSkeleton /> : venues.map(v => <VenueCard key={v.poolId} {...v} />)}
          </div>
        )}
      </div>
    </>
  )
}
