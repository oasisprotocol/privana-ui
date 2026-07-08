import { useMemo, useState } from 'react'
import { PrivanaModal } from '@oasisprotocol/privana-sdk'
import { Skeleton } from '@/components/ui/skeleton'
import { useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { PageHeading } from '@/components/PageHeading'
import { useFunds } from '@/hooks/useFunds'
import { useActiveStrategies } from './useActiveStrategies'
import { EarnBalance } from './EarnBalance'
import { VenueCard, type Venue } from './VenueCard'

const VenueCardSkeleton = () => <Skeleton className="h-44 w-full rounded-2xl md:h-24" />

export const EarnDashboard = () => {
  const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading, error: tokensError } = useTokens()
  const { earningFiatValue, bestApyBps, pricesError, availableTokenIds } = useFunds()
  const { strategies: activePositions, isLoading: positionsLoading } = useActiveStrategies()
  const isLoading = poolsLoading || tokensLoading || positionsLoading
  const [depositOpen, setDepositOpen] = useState(false)

  const venues = useMemo<Venue[]>(() => {
    if (!poolsData || !tokensData) return []
    const tokensById = new Map(tokensData.tokens.map(t => [t.token_id, t]))
    const positionByPool = new Map(activePositions.map(p => [p.poolId, p]))
    return poolsData.pools
      .filter(p => p.status === 'active')
      .map(p => {
        const token = tokensById.get(p.token_id)
        const position = positionByPool.get(p.pool_id)
        return {
          poolId: p.pool_id,
          tokenId: p.token_id,
          strategyKey: p.strategy,
          asset: token?.token_symbol ?? '—',
          chain: token?.chain_name ?? '—',
          apyBps: p.apy_bps,
          earning: position?.earning ?? null,
          earningToday: position?.earningToday ?? null,
        }
      })
  }, [poolsData, tokensData, activePositions])

  return (
    <>
      <PageHeading
        title="Earn"
        description="Where your funds are earning — withdraw anytime."
        className="max-w-200 md:max-w-none"
      />

      <div className="w-full max-w-200 md:max-w-none mx-auto mt-8 flex flex-col gap-8">
        <EarnBalance earningFiatValue={earningFiatValue} bestApyBps={bestApyBps} pricesError={pricesError} />

        {(poolsError || tokensError) && <p className="text-destructive">Unable to load earn pools</p>}

        {(isLoading || venues.length > 0) && (
          <div className="flex flex-col gap-3">
            <div className="hidden md:block">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Venues</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your positions across protocols — withdraw anytime.
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground md:hidden">
              Venues
            </p>
            {isLoading ? (
              <VenueCardSkeleton />
            ) : (
              venues.map(v => (
                <VenueCard
                  key={v.poolId}
                  {...v}
                  hasAvailableBalance={availableTokenIds.has(v.tokenId)}
                  onRequestDeposit={() => setDepositOpen(true)}
                />
              ))
            )}
          </div>
        )}
      </div>

      <PrivanaModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        showLockedFunds={false}
        defaultTab="deposit"
      />
    </>
  )
}
