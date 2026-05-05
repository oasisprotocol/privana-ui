import { Link } from 'react-router'
import { useAccount } from 'wagmi'
import { useEarnBalance, useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount } from '@/lib/tokens'
import { earnCreatePath, earnWithdrawPath } from '@/paths'
import { STRATEGY_LABELS } from './labels'
import { ProtocolLabel } from './ProtocolLabel'

const formatApy = (bps: number) => (bps > 0 ? `+${(bps / 100).toFixed(2)}%` : '-')

type StrategyCardProps = {
  poolId: string
  name: string
  earning: string
  apyLabel: string
  asset: string
  strategyKey: string | null
}

const StrategyCard = ({ poolId, name, earning, apyLabel, asset, strategyKey }: StrategyCardProps) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border p-8 rounded-lg">
    <div className="flex flex-col gap-3 min-w-0">
      <p className="text-xl font-medium text-foreground">{name}</p>
      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Earning</span>
          <span className="text-foreground text-lg font-semibold">{earning}</span>
        </div>
        <div className="flex items-center gap-2">
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
          <span className="text-foreground">
            {strategyKey ? <ProtocolLabel strategy={strategyKey} /> : '—'}
          </span>
        </div>
      </div>
    </div>
    <div className="flex gap-3 w-full md:w-auto">
      <Button asChild size="lg" className="flex-1 md:w-35">
        <Link to={earnCreatePath(poolId)}>Add</Link>
      </Button>
      <Button asChild variant="secondary" size="lg" className="flex-1 md:w-35">
        <Link to={earnWithdrawPath(poolId)}>Withdraw</Link>
      </Button>
    </div>
  </div>
)

const StrategyCardSkeleton = () => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border p-8 rounded-lg">
    <div className="flex flex-col gap-3 min-w-0 flex-1">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-5 w-64" />
    </div>
    <Skeleton className="h-12 w-full md:w-72" />
  </div>
)

export const ActiveStrategies = () => {
  const { address } = useAccount()
  const { data: balanceData, isLoading: balanceLoading } = useEarnBalance(address)
  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading } = useTokens()

  const isLoading = balanceLoading || poolsLoading || tokensLoading

  const positions = balanceData?.positions ?? []
  const pools = poolsData?.pools ?? []
  const tokensById = new Map((tokensData?.tokens ?? []).map(t => [t.token_id, t]))
  const poolsById = new Map(pools.map(p => [p.pool_id, p]))

  const strategies = positions
    .filter(p => {
      try {
        return BigInt(p.shares ?? '0') > 0n
      } catch {
        return false
      }
    })
    .map(pos => {
      const pool = poolsById.get(pos.pool_id)
      const token = pool ? tokensById.get(pool.token_id) : tokensById.get(pos.token_id)
      const decimals = token?.token_decimals
      return {
        poolId: pos.pool_id,
        name: pool ? (STRATEGY_LABELS[pool.strategy] ?? pool.strategy) : pos.pool_id,
        earning:
          decimals != null
            ? `${formatAmount(BigInt(pos.underlying_amount), decimals)} ${token?.token_symbol ?? ''}`
            : '-',
        apyLabel: pool ? formatApy(pool.apy_bps) : '-',
        asset: token?.token_symbol ?? '—',
        strategyKey: pool?.strategy ?? null,
      }
    })

  if (!isLoading && strategies.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-2xl font-medium text-foreground">Your active strategies</p>
        <p className="text-sm text-muted-foreground">
          Your allowance earns yield automatically while sitting in the vault.
        </p>
      </div>
      {isLoading ? <StrategyCardSkeleton /> : strategies.map(s => <StrategyCard key={s.poolId} {...s} />)}
    </div>
  )
}
