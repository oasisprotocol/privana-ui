import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { earnCreatePath } from '@/paths'
import { ActiveStrategies } from './ActiveStrategies'
import { EarnHeader } from './EarnHeader'
import { formatApyBps, STRATEGY_LABELS } from './labels'
import { ProtocolLabel } from './ProtocolLabel'

type YieldCardProps = {
  id: string
  name: ReactNode
  apyLabel: string
  asset: string
  chain: string
}

const YieldCard = ({ id, name, apyLabel, asset, chain }: YieldCardProps) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border p-8 rounded-lg">
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex flex-col gap-1">
        <p className="text-xl font-medium text-foreground">{name}</p>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">APY</span>
          <span className="text-chart-positive text-lg">{apyLabel}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-sm font-medium">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Asset</span>
          <span className="text-foreground">{asset}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Protocol</span>
          <span className="text-foreground">{chain}</span>
        </div>
      </div>
    </div>
    <Button asChild size="lg" className="w-full md:w-35">
      <Link to={earnCreatePath(id)}>Select</Link>
    </Button>
  </div>
)

const YieldCardSkeleton = () => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border p-8 rounded-lg">
    <div className="flex flex-col gap-3 min-w-0 flex-1">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-5 w-64" />
    </div>
    <Skeleton className="h-12 w-full md:w-35" />
  </div>
)

export const EarnDashboard = () => {
  const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading, error: tokensError } = useTokens()
  const isLoading = poolsLoading || tokensLoading

  const { strategies, protocols } = useMemo(() => {
    if (!poolsData || !tokensData) return { strategies: [], protocols: [] }
    const tokensById = new Map(tokensData.tokens.map(t => [t.token_id, t]))
    const items = poolsData.pools
      .filter(p => p.status === 'active')
      .map(p => {
        const token = tokensById.get(p.token_id)
        return {
          id: p.pool_id,
          strategyKey: p.strategy,
          apyLabel: `+${formatApyBps(p.apy_bps)}`,
          asset: token?.token_symbol ?? '—',
          chain: token?.chain_name ?? '—',
        }
      })
    return {
      strategies: items.map(i => ({ ...i, name: STRATEGY_LABELS[i.strategyKey] ?? i.strategyKey })),
      protocols: items.map(i => ({ ...i, name: <ProtocolLabel strategy={i.strategyKey} iconSize={24} /> })),
    }
  }, [poolsData, tokensData])

  return (
    <>
      <EarnHeader
        action={
          <Button asChild size="lg" className="w-full md:w-auto">
            <Link to={earnCreatePath()}>Select your strategy</Link>
          </Button>
        }
      />

      <ActiveStrategies />

      {(poolsError || tokensError) && <p className="text-destructive">Unable to load earn pools</p>}

      {(isLoading || strategies.length > 0) && (
        <div className="flex flex-col gap-6">
          <p className="text-[15px] font-bold text-muted-foreground uppercase">
            Diversified Yield strategies
          </p>
          {isLoading ? <YieldCardSkeleton /> : strategies.map(s => <YieldCard key={s.id} {...s} />)}
        </div>
      )}

      {(isLoading || protocols.length > 0) && (
        <div className="flex flex-col gap-6">
          <p className="text-[15px] font-bold text-muted-foreground uppercase">Available protocols</p>
          {isLoading ? <YieldCardSkeleton /> : protocols.map(p => <YieldCard key={p.id} {...p} />)}
        </div>
      )}
    </>
  )
}
