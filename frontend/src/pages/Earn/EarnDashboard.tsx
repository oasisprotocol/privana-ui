import { useMemo, useState } from 'react'
import { DepositModal } from '@oasisprotocol/privana-sdk'
import { Skeleton } from '@/components/ui/skeleton'
import { useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { PageHeading } from '@/components/PageHeading'
import { useFunds } from '@/hooks/useFunds'
import { SWAPPABLE_TOKEN_IDS } from '@/config/tokens'
import { useResetBalanceCaches } from '@/hooks/use-reset-balance-caches'
import { useActiveStrategies } from './useActiveStrategies'
import { EarnBalance } from './EarnBalance'
import { VenueCard, type Venue } from './VenueCard'
import { GetTokenDialog } from './GetTokenDialog'

const VenueCardSkeleton = () => <Skeleton className="h-44 w-full rounded-2xl md:h-24" />

export const EarnDashboard = () => {
  const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading, error: tokensError } = useTokens()
  const {
    earningFiatValue,
    earnChange24h,
    bestApyBps,
    pricesError,
    isError: fundsError,
    availableTokenIds,
    hasAvailableBalance,
    isLoading: fundsLoading,
  } = useFunds()
  const {
    strategies: activePositions,
    projectedMonthly,
    earned,
    isLoading: positionsLoading,
    isError: positionsError,
  } = useActiveStrategies()
  const isLoading = poolsLoading || tokensLoading || positionsLoading || positionsError
  const [depositOpen, setDepositOpen] = useState(false)
  const [getTokenFor, setGetTokenFor] = useState<Venue | null>(null)
  const resetBalanceCaches = useResetBalanceCaches()

  const venues = useMemo<Venue[]>(() => {
    if (!poolsData || !tokensData) return []
    const tokensById = new Map(tokensData.tokens.map(t => [t.token_id, t]))
    const positionByPool = new Map(activePositions.map(p => [p.poolId, p]))
    return poolsData.pools
      .filter(p => p.status === 'active' || positionByPool.has(p.pool_id))
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
          paused: p.status !== 'active',
        }
      })
  }, [poolsData, tokensData, activePositions])

  return (
    <>
      <PageHeading
        title="Earn"
        description="Put your funds to work. Withdraw anytime."
        className="max-w-200 md:max-w-none"
      />

      <div className="w-full max-w-200 md:max-w-none mx-auto mt-8 flex flex-col gap-8">
        <EarnBalance
          earningFiatValue={earningFiatValue}
          bestApyBps={bestApyBps}
          pricesError={pricesError || fundsError}
          projected={projectedMonthly}
          earned={earned}
          change={earnChange24h}
          loading={fundsLoading}
        />

        {(poolsError || tokensError) && <p className="text-destructive">Unable to load earn pools</p>}
        {positionsError && <p className="text-destructive">Unable to load your positions</p>}

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
                  // Swap hand-off only when the venue token can be swapped for; otherwise deposit.
                  // The swappable flag is a testnet artifact and goes away with #174.
                  // TODO: match the venue's minimum deposit once the backend defines it.
                  onRequestDeposit={() =>
                    hasAvailableBalance && (SWAPPABLE_TOKEN_IDS as string[]).includes(v.tokenId)
                      ? setGetTokenFor(v)
                      : setDepositOpen(true)
                  }
                />
              ))
            )}
          </div>
        )}
      </div>

      <GetTokenDialog
        open={getTokenFor != null}
        onClose={() => setGetTokenFor(null)}
        tokenId={getTokenFor?.tokenId ?? ''}
        asset={getTokenFor?.asset ?? ''}
        chain={getTokenFor?.chain ?? ''}
      />
      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onDepositSuccess={() => {
          resetBalanceCaches()
          setDepositOpen(false)
        }}
      />
    </>
  )
}
